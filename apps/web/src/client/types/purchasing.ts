export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  leadTimeDays: number;
  terms: string;
  onTimePct: number;
}

export interface PurchaseOrderLine {
  variantId: string;
  ordered: number;
  received: number;
  /** Integer cents (LKR). */
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  createdAt: string;
  expectedAt: string;
  createdBy: string;
  note: string;
}