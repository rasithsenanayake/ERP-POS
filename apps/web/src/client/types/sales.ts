export type OrderStatus =
'draft' |
'pending' |
'confirmed' |
'processing' |
'ready' |
'fulfilled' |
'cancelled' |
'returned' |
'refunded';

export type PaymentStatus =
'unpaid' |
'pending' |
'partially_paid' |
'paid' |
'partially_refunded' |
'refunded' |
'failed';

export type SalesChannel = 'in_store' | 'online' | 'phone' | 'wholesale';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'qr';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
}

export interface Payment {
  id: string;
  kind: 'payment' | 'refund';
  amount: number;
  method: PaymentMethod;
  reference: string;
  createdAt: string;
  userId: string;
}

export type TimelineEventType =
'created' |
'confirmed' |
'payment' |
'refund' |
'fulfilled' |
'note' |
'assigned' |
'cancelled' |
'notified' |
'returned' |
'status' |
'tag' |
'updated' |
'failed';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  message: string;
  userId: string;
  createdAt: string;
  meta?: Record<string, string>;
}

export interface Order {
  id: string;
  number: string;
  channel: SalesChannel;
  customerId: string | null;
  branchId: string;
  warehouseId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  orderDiscount: number;
  shipping: number;
  payments: Payment[];
  assignedTo: string;
  createdBy: string;
  customerNote: string;
  createdAt: string;
  fulfilledAt: string | null;
  timeline: TimelineEvent[];
}

export type PaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30';

export interface Customer {
  id: string;
  number: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  type: 'individual' | 'business';
  tags: string[];
  source: string;
  salespersonId: string;
  branchId: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  taxId: string;
  loyaltyPoints: number;
  createdAt: string;
  activity: TimelineEvent[];
  notes: TimelineEvent[];
}