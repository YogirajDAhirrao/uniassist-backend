export interface CreateSessionResponse {
  sessionId: string;
  createdAt: Date;
}

export interface SendMessageDto {
  sessionId: string;
  content: string;
}

export interface DocumentSource {
  documentId: string;
  title: string;
  chunkIndex: number;
  score: number;
}

export interface ChatMessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  sources?: DocumentSource[];
}

export interface ChatSessionWithMessages {
  id: string;
  createdAt: Date;
  messages: ChatMessageResponse[];
}

export interface StreamChunk {
  type: "delta" | "sources" | "done" | "error";
  content?: string;
  sources?: DocumentSource[];
  error?: string;
}