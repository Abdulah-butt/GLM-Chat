export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatResponseData {
  reply: { role: 'assistant'; content: string };
}

export interface OrderRequest {
  orderNumber: string;
  packageType: '5kg_box' | '10kg_box' | 'full_pallet' | 'container';
  filletSize: 'small' | 'medium' | 'large';
  quantity: number;
  destination: string;
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  notes?: string;
  status: string;
  createdAt: string;
}
