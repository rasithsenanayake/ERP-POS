export type TicketStatus = 'open' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketChannel = 'email' | 'whatsapp' | 'phone' | 'walk_in';

export interface TicketMessage {
  id: string;
  author: 'customer' | 'agent';
  userId: string | null;
  body: string;
  at: string;
  internal: boolean;
}

export interface Ticket {
  id: string;
  number: string;
  subject: string;
  customerId: string;
  channel: TicketChannel;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  createdAt: string;
  slaDueAt: string;
  orderRef: string | null;
  messages: TicketMessage[];
}