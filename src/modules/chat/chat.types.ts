export interface CreateSessionResponse {
  sessionId: string;
  createdAt: Date;
}

export interface SendMessageDto {
  sessionId: string;
  content: string;
}

export interface ChatMessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatSessionWithMessages {
  id: string;
  createdAt: Date;
  messages: ChatMessageResponse[];
}

export interface StreamChunk {
  type: "delta" | "done" | "error";
  content?: string;
  error?: string;
}