export type MovementType =
'opening' |
'receive' |
'issue' |
'adjustment' |
'write_off' |
'sale' |
'return' |
'transfer_out' |
'transfer_in';

export interface StockBalance {
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  incoming: number;
  damaged: number;
}

export interface LedgerReference {
  kind: 'order' | 'transfer' | 'adjustment' | 'opening' | 'receipt';
  id: string;
  label: string;
}

export interface LedgerEntry {
  id: string;
  seq: number;
  variantId: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  before: number;
  change: number;
  after: number;
  reference: LedgerReference;
  userId: string;
  reason: string;
  createdAt: string;
}

export type TransferStatus = 'draft' | 'requested' | 'approved' | 'in_transit' | 'received' | 'cancelled';

export interface TransferLine {
  variantId: string;
  quantity: number;
}

export interface TransferEvent {
  status: TransferStatus;
  at: string;
  userId: string;
}

export interface Transfer {
  id: string;
  number: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  lines: TransferLine[];
  note: string;
  createdBy: string;
  createdAt: string;
  history: TransferEvent[];
}

export type AdjustmentKind = 'receive' | 'issue' | 'adjustment' | 'write_off';