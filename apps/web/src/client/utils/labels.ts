import type { PaymentMethod, SalesChannel } from '../types/sales';

export const channelLabels: Record<SalesChannel, string> = {
  in_store: 'In store',
  online: 'Online',
  phone: 'Phone',
  wholesale: 'Wholesale'
};

export function customerTagTone(tag: string): 'accent' | 'critical' | 'info' | 'neutral' {
  if (tag === 'VIP') return 'accent';
  if (tag === 'High Risk') return 'critical';
  if (tag === 'Wholesale' || tag === 'Corporate') return 'info';
  return 'neutral';
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  qr: 'LankaQR'
};