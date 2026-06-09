export type Role = 'user' | 'model';

export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 representation
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  category: 'legal' | 'funding' | 'market' | 'admin' | 'product';
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}
