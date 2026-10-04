import type { Customer, Order, PaymentStatus, PaymentTerms } from '../types/sales';
import { DAY } from './dates';

export interface OrderTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  shipping: number;
  total: number;
  paid: number;
  refunded: number;
  netPaid: number;
  balance: number;
  cost: number;
  netSales: number;
  units: number;
}

const CLOSED: Order['status'][] = ['cancelled', 'refunded', 'returned', 'draft'];

/** Prices are VAT-inclusive (standard Sri Lankan retail practice). */
export function orderTotals(order: Order, taxRateBps: number): OrderTotals {
  let subtotal = 0;
  let lineDiscount = 0;
  let cost = 0;
  let units = 0;
  for (const item of order.items) {
    subtotal += item.unitPrice * item.quantity;
    lineDiscount += item.discount;
    cost += item.unitCost * item.quantity;
    units += item.quantity;
  }
  const discount = lineDiscount + order.orderDiscount;
  const taxable = Math.max(0, subtotal - discount);
  const exTax = Math.round(taxable * 10000 / (10000 + taxRateBps));
  const tax = taxable - exTax;
  const total = taxable + order.shipping;
  let paid = 0;
  let refunded = 0;
  for (const payment of order.payments) {
    if (payment.kind === 'payment') paid += payment.amount;else
    refunded += payment.amount;
  }
  const netPaid = paid - refunded;
  const balance = CLOSED.includes(order.status) ? 0 : Math.max(0, total - paid);
  const refundedExTax = Math.round(refunded * 10000 / (10000 + taxRateBps));
  const netSales = Math.max(0, exTax - refundedExTax);
  return { subtotal, discount, taxable, tax, shipping: order.shipping, total, paid, refunded, netPaid, balance, cost, netSales, units };
}

export function isRevenueOrder(order: Order): boolean {
  return order.status !== 'draft' && order.status !== 'cancelled';
}

/** Cost of goods sold — goods that came back (returned) or were never shipped (refunded) carry no cost. */
export function orderCogs(order: Order): number {
  if (['draft', 'cancelled', 'returned', 'refunded'].includes(order.status)) return 0;
  return order.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
}

export function derivePaymentStatus(total: number, paid: number, refunded: number): PaymentStatus {
  if (refunded > 0) return refunded >= paid ? 'refunded' : 'partially_refunded';
  if (paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partially_paid';
}

export const termsDays: Record<PaymentTerms, number> = { due_on_receipt: 0, net_15: 15, net_30: 30 };
export const termsLabel: Record<PaymentTerms, string> = { due_on_receipt: 'Due on receipt', net_15: 'Net 15', net_30: 'Net 30' };

export function orderDueAt(order: Order, customer: Customer | undefined): number {
  const base = new Date(order.fulfilledAt ?? order.createdAt).getTime();
  const days = customer ? termsDays[customer.paymentTerms] : 0;
  return base + days * DAY;
}

export function isReservedStatus(status: Order['status']): boolean {
  return status === 'confirmed' || status === 'processing' || status === 'ready';
}

export function isOpenForFulfilment(status: Order['status']): boolean {
  return status === 'pending' || isReservedStatus(status);
}