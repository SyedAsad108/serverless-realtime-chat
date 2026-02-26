export interface User {
  userId: string;
  username: string;
}

export interface Message {
  message: string;
  conversationId?: string;
  messageId?: string;
  receiverId: string;
  senderId: string;
  timestamp: number;
}

export interface AuthResponse {
  message: string;
  userId: string;
}

export interface IncomingWSMessage {
  senderId: string;
  message: string;
  timestamp: number;
}
