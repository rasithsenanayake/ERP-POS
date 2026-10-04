import type { Tone } from '../components/ui/Badge';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/purchasing';

export const poStatusMeta: Record<PurchaseOrderStatus, {label: string;tone: Tone;}> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  partial: { label: 'Partially received', tone: 'warning' },
  received: { label: 'Received', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'outline' }
};

export function poTotal(po: PurchaseOrder): number {
  return po.lines.reduce((sum, l) => sum + l.unitCost * l.ordered, 0);
}

export function poOutstandingValue(po: PurchaseOrder): number {
  if (po.status === 'cancelled' || po.status === 'received') return 0;
  return po.lines.reduce((sum, l) => sum + l.unitCost * (l.ordered - l.received), 0);
}

export function poUnits(po: PurchaseOrder): {ordered: number;received: number;} {
  return po.lines.reduce((acc, l) => ({ ordered: acc.ordered + l.ordered, received: acc.received + l.received }), { ordered: 0, received: 0 });
}

export function isPoOverdue(po: PurchaseOrder, now: number): boolean {
  return (po.status === 'sent' || po.status === 'partial') && new Date(po.expectedAt).getTime() < now;
}