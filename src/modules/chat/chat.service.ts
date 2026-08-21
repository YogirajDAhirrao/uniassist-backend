import Groq from "groq-sdk";
import { prisma } from "../../lib/prisma.js";
import { getEmbedding } from "../ingestion/embedding.service.js";
import { qdrantClient } from "../../lib/qdrant.js";
import {
  ChatMessageResponse,
  ChatSessionWithMessages,
  CreateSessionResponse,
  DocumentSource,
  StreamChunk,
} from "./chat.types.js";

const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY_MESSAGES = 20;
const TOP_K_CHUNKS = 4;
const COLLECTION = "documents";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export class ChatService {
  // ── Session management ──────────────────────────────────────────────────────

  async createSession(userId: string): Promise<CreateSessionResponse> {
    const session = await prisma.chatSession.create({
      data: { userId },
    });
    return { sessionId: session.id, createdAt: session.createdAt };
  }

  async getSession(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionWithMessages> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) throw new Error("Session not found");

    return {
      id: session.id,
      createdAt: session.createdAt,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async listSessions(userId: string): Promise<CreateSessionResponse[]> {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return sessions.map((s) => ({ sessionId: s.id, createdAt: s.createdAt }));
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error("Session not found");
    await prisma.chatSession.delete({ where: { id: sessionId } });
  }

  // ── Messaging ───────────────────────────────────────────────────────────────

  async sendMessage(
    sessionId: string,
    userId: string,
    userContent: string,
  ): Promise<ChatMessageResponse> {
    await this.assertSessionOwner(sessionId, userId);

    // 1. Fetch history BEFORE saving the new user message
    const { messages, sources } = await this.buildMessagesWithContext(
      sessionId,
      userContent,
    );

    // 2. Save user message AFTER building history
    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: userContent },
    });

    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages,
      });

      const assistantContent = response.choices[0].message.content ?? "";

      // 3. Only save non-empty responses
      if (!assistantContent.trim()) {
        throw new Error("Received empty response from AI");
      }

      const saved = await prisma.chatMessage.create({
        data: { sessionId, role: "assistant", content: assistantContent },
      });

      return {
        id: saved.id,
        role: "assistant",
        content: assistantContent,
        createdAt: saved.createdAt,
        sources,
      };
    } catch (err: any) {
      if (err?.status === 429) {
        throw new Error("AI service is busy, please try again in a moment");
      }
      throw err;
    }
  }

  async *streamMessage(
    sessionId: string,
    userId: string,
    userContent: string,
  ): AsyncGenerator<StreamChunk> {
    await this.assertSessionOwner(sessionId, userId);

    // 1. Fetch history BEFORE saving the new user message
    const { messages, sources } = await this.buildMessagesWithContext(
      sessionId,
      userContent,
    );

    // 2. Save user message AFTER building history
    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: userContent },
    });

    // 2b. Emit sources immediately so the client can display citations
    if (sources.length > 0) {
      yield { type: "sources", sources };
    }

    let fullContent = "";

    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          fullContent += text;
          yield { type: "delta", content: text };
        }
      }

      // 3. Only save non-empty responses
      if (fullContent.trim()) {
        await prisma.chatMessage.create({
          data: { sessionId, role: "assistant", content: fullContent },
        });
      }

      yield { type: "done" };
    } catch (err: any) {
      if (err?.status === 429) {
        yield {
          type: "error",
          error: "AI service is busy, please try again in a moment",
        };
        return;
      }
      const message = err instanceof Error ? err.message : "Stream error";
      yield { type: "error", error: message };
    }
  }

  // ── RAG + History ───────────────────────────────────────────────────────────

  private async buildMessagesWithContext(
    sessionId: string,
    userQuestion: string,
  ): Promise<{
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    sources: DocumentSource[];
  }> {
    // 1. Retrieve relevant chunks from Qdrant
    const { contextText, sources } = await this.retrieveContext(userQuestion);

    // 2. Build system prompt
    const systemContent = contextText
      ? `You are a helpful AI assistant. Answer questions based on the provided context.
If the answer is not in the context, answer from your general knowledge but mention it.
Always be clear and concise.

CONTEXT FROM DOCUMENTS:
${contextText}`
      : `You are a helpful AI assistant. Answer questions clearly and concisely.
If you don't know something, say so honestly.`;

    // 3. Fetch existing history (does NOT include current message yet)
    const history = await this.buildMessageHistory(sessionId);

    // 4. Append current user question at the end
    return {
      messages: [
        { role: "system", content: systemContent },
        ...history,
        { role: "user", content: userQuestion },
      ],
      sources,
    };
  }

  private async retrieveContext(
    question: string,
  ): Promise<{ contextText: string | null; sources: DocumentSource[] }> {
    try {
      const questionVector = await getEmbedding(question);

      const result = await qdrantClient.query(COLLECTION, {
        query: questionVector,
        limit: TOP_K_CHUNKS,
        with_payload: true,
        score_threshold: 0.5,
      });

      const results = result.points;

      if (results.length === 0) {
        return {
          contextText: null,
          sources: [],
        };
      }

      // Look up document titles for the matched documentIds
      const documentIds = [
        ...new Set(
          results
            .map((r) => (r.payload as any)?.documentId as string)
            .filter(Boolean),
        ),
      ];

      const documents = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: { id: true, title: true },
      });
      const titleMap = new Map(documents.map((d) => [d.id, d.title]));

      const sources: DocumentSource[] = [];

      const contextText = results
        .map((r, i) => {
          const payload = r.payload as {
            content?: string;
            documentId?: string;
            chunkIndex?: number;
          };

          if (payload.documentId) {
            sources.push({
              documentId: payload.documentId,
              title: titleMap.get(payload.documentId) ?? "Unknown Document",
              chunkIndex: payload.chunkIndex ?? i,
              score: Math.round(r.score * 100) / 100,
            });
          }

          return `[${i + 1}] ${payload.content ?? ""}`;
        })
        .filter((text) => text.trim().length > 4)
        .join("\n\n");

      return { contextText: contextText || null, sources };
    } catch (err) {
      console.error("[RAG] Context retrieval failed:", err);
      return { contextText: null, sources: [] };
    }
  }

  private async buildMessageHistory(
    sessionId: string,
  ): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        content: { not: "" }, // ← skip empty messages from previous failed attempts
      },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    });

    return messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  private async assertSessionOwner(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error("Session not found or access denied");
  }
}
