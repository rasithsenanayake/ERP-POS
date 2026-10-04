import React from 'react';
import type { ProductStatus } from '../../types/catalog';
import type { TransferStatus } from '../../types/inventory';
import type { OrderStatus, PaymentStatus } from '../../types/sales';
import { Badge, Tone } from './Badge';

type Kind = 'order' | 'payment' | 'transfer' | 'product';

const orderMap: Record<OrderStatus, [string, Tone]> = {
  draft: ['Draft', 'outline'],
  pending: ['Pending', 'warning'],
  confirmed: ['Confirmed', 'info'],
  processing: ['Processing', 'info'],
  ready: ['Ready', 'accent'],
  fulfilled: ['Fulfilled', 'neutral'],
  cancelled: ['Cancelled', 'outline'],
  returned: ['Returned', 'neutral'],
  refunded: ['Refunded', 'neutral']
};

const paymentMap: Record<PaymentStatus, [string, Tone]> = {
  unpaid: ['Unpaid', 'warning'],
  pending: ['Payment pending', 'warning'],
  partially_paid: ['Partially paid', 'warning'],
  paid: ['Paid', 'positive'],
  partially_refunded: ['Partially refunded', 'neutral'],
  refunded: ['Refunded', 'neutral'],
  failed: ['Payment failed', 'critical']
};

const transferMap: Record<TransferStatus, [string, Tone]> = {
  draft: ['Draft', 'outline'],
  requested: ['Requested', 'warning'],
  approved: ['Approved', 'info'],
  in_transit: ['In transit', 'accent'],
  received: ['Received', 'positive'],
  cancelled: ['Cancelled', 'outline']
};

const productMap: Record<ProductStatus, [string, Tone]> = {
  active: ['Active', 'positive'],
  draft: ['Draft', 'info'],
  archived: ['Archived', 'outline']
};

export function statusLabel(kind: Kind, status: string): string {
  const map = { order: orderMap, payment: paymentMap, transfer: transferMap, product: productMap }[kind] as Record<string, [string, Tone]>;
  return map[status]?.[0] ?? status;
}

export function StatusBadge({ kind, status }: {kind: Kind;status: string;}) {
  const map = { order: orderMap, payment: paymentMap, transfer: transferMap, product: productMap }[kind] as Record<string, [string, Tone]>;
  const [label, tone] = map[status] ?? [status, 'neutral'];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>);

}