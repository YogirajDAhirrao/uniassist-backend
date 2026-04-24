import Groq from "groq-sdk";
import { prisma } from "../../lib/prisma.js";
import {
  ChatMessageResponse,
  ChatSessionWithMessages,
  CreateSessionResponse,
  StreamChunk,
} from "./chat.types.js";

const MODEL = "llama-3.3-70b-versatile";
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer questions clearly and concisely.
If you don't know something, say so honestly.`;

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
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
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

  /**
   * Send a message and get a full (non-streaming) response.
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    userContent: string,
  ): Promise<ChatMessageResponse> {
    await this.assertSessionOwner(sessionId, userId);

    // Persist user message
    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: userContent },
    });

    // Build history for context
    const history = await this.buildMessageHistory(sessionId);

    // Call Groq
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      });

      const assistantContent = response.choices[0].message.content ?? "";

      // Persist assistant reply
      const saved = await prisma.chatMessage.create({
        data: { sessionId, role: "assistant", content: assistantContent },
      });

      return {
        id: saved.id,
        role: "assistant",
        content: assistantContent,
        createdAt: saved.createdAt,
      };
    } catch (err: any) {
      if (err?.status === 429) {
        throw new Error("AI service is busy, please try again in a moment");
      }
      throw err;
    }
  }

  /**
   * Send a message and stream the response back via an async generator.
   * The assistant message is persisted once the full stream completes.
   */
  async *streamMessage(
    sessionId: string,
    userId: string,
    userContent: string,
  ): AsyncGenerator<StreamChunk> {
    await this.assertSessionOwner(sessionId, userId);

    await prisma.chatMessage.create({
      data: { sessionId, role: "user", content: userContent },
    });

    const history = await this.buildMessageHistory(sessionId);

    let fullContent = "";

    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          fullContent += text;
          yield { type: "delta", content: text };
        }
      }

      // Persist the complete assistant message after stream ends
      await prisma.chatMessage.create({
        data: { sessionId, role: "assistant", content: fullContent },
      });

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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async assertSessionOwner(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new Error("Session not found or access denied");
  }

  /**
   * Returns the last MAX_HISTORY_MESSAGES messages formatted for the Groq API.
   * NOTE: When you add RAG later, inject retrieved context into the last user
   * message content here.
   */
  private async buildMessageHistory(
    sessionId: string,
  ): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    });

    return messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }
}
