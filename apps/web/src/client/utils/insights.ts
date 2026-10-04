import type { Product, Variant } from '../types/catalog';
import type { LedgerEntry } from '../types/inventory';
import type { Branch, Warehouse } from '../types/org';
import type { Customer, Order } from '../types/sales';
import { DAY } from './dates';
import { Balances, availableQty, getBalance } from './inventory';
import { branchComparison, PeriodRange, pctChange, summarize, topProducts } from './metrics';
import { formatMoney } from './money';
import { orderDueAt, orderTotals } from './orderMath';

export type InsightTone = 'positive' | 'warning' | 'critical' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  href: string;
}

export interface InsightInput {
  orders: Order[];
  products: Product[];
  variants: Variant[];
  productsById: Map<string, Product>;
  balances: Balances;
  ledger: LedgerEntry[];
  warehouses: Warehouse[];
  branches: Branch[];
  customers: Customer[];
  range: PeriodRange;
  bps: number;
  now: Date;
  canViewCost: boolean;
}

const toneRank: Record<InsightTone, number> = { critical: 0, warning: 1, positive: 2, neutral: 3 };

/** Every insight below is derived from stored orders, balances and the stock ledger — nothing is hardcoded. */
export function computeInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const { orders, range, bps, now } = input;
  const nowMs = now.getTime();

  // 1. Sales trend versus previous period.
  const current = summarize(orders, range.start, range.end, bps);
  const previous = summarize(orders, range.prevStart, range.prevEnd, bps);
  const change = pctChange(current.netSales, previous.netSales);
  if (change !== null && previous.netSales > 0 && Math.abs(change) >= 5) {
    insights.push({
      id: 'trend',
      tone: change > 0 ? 'positive' : 'warning',
      title: `Net sales ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% on the previous period`,
      detail: `${formatMoney(current.netSales)} vs ${formatMoney(previous.netSales)} across ${current.orders} orders`,
      href: '/orders'
    });
  }

  // 2. Runout estimate from the last 30 days of sales in the ledger.
  const since = nowMs - 30 * DAY;
  const storeIds = new Set(input.warehouses.filter((w) => w.kind === 'store').map((w) => w.id));
  const sold = new Map<string, number>();
  for (const entry of input.ledger) {
    if (!storeIds.has(entry.warehouseId) || new Date(entry.createdAt).getTime() < since) continue;
    if (entry.type !== 'sale' && entry.type !== 'return') continue;
    const key = `${entry.variantId}@${entry.warehouseId}`;
    sold.set(key, (sold.get(key) ?? 0) - entry.change);
  }
  const runouts: {key: string;days: number;available: number;rate: number;}[] = [];
  sold.forEach((units, key) => {
    if (units <= 0) return;
    const [variantId, warehouseId] = key.split('@');
    const available = availableQty(getBalance(input.balances, variantId, warehouseId));
    const rate = units / 30;
    const days = available / rate;
    if (days <= 14) runouts.push({ key, days, available, rate });
  });
  runouts.
  sort((a, b) => a.days - b.days).
  slice(0, 2).
  forEach((r) => {
    const [variantId, warehouseId] = r.key.split('@');
    const variant = input.variants.find((v) => v.id === variantId);
    const product = variant ? input.productsById.get(variant.productId) : undefined;
    const warehouse = input.warehouses.find((w) => w.id === warehouseId);
    if (!variant || !product || !warehouse) return;
    const name = `${product.name}${variant.title !== 'Default' ? ` (${variant.title})` : ''}`;
    insights.push({
      id: `runout-${r.key}`,
      tone: r.available === 0 ? 'critical' : 'warning',
      title: r.available === 0 ? `${name} is out of stock at ${warehouse.name}` : `${name} likely to run out at ${warehouse.name} in ~${Math.max(1, Math.round(r.days))} days`,
      detail: `${r.available} available · selling ~${r.rate.toFixed(1)}/day over the last 30 days`,
      href: `/products/${product.id}`
    });
  });

  // 3. Overdue customer balances (due date from payment terms).
  const overdueByCustomer = new Map<string, {amount: number;orders: number;oldest: number;}>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const balance = orderTotals(order, bps).balance;
    if (balance <= 0 || order.status === 'draft') continue;
    const customer = input.customers.find((c) => c.id === order.customerId);
    const due = orderDueAt(order, customer);
    if (due >= nowMs || order.status !== 'fulfilled') continue;
    const row = overdueByCustomer.get(order.customerId) ?? { amount: 0, orders: 0, oldest: 0 };
    row.amount += balance;
    row.orders += 1;
    row.oldest = Math.max(row.oldest, Math.floor((nowMs - due) / DAY));
    overdueByCustomer.set(order.customerId, row);
  }
  const topOverdue = Array.from(overdueByCustomer.entries()).sort((a, b) => b[1].amount - a[1].amount)[0];
  if (topOverdue) {
    const customer = input.customers.find((c) => c.id === topOverdue[0]);
    if (customer) {
      const others = overdueByCustomer.size - 1;
      insights.push({
        id: 'overdue',
        tone: 'critical',
        title: `${customer.company || customer.name} has ${formatMoney(topOverdue[1].amount)} overdue`,
        detail: `${topOverdue[1].orders} order${topOverdue[1].orders > 1 ? 's' : ''}, oldest ${topOverdue[1].oldest} days past due${others > 0 ? ` · ${others} more customer${others > 1 ? 's' : ''} overdue` : ''}`,
        href: `/customers/${customer.id}`
      });
    }
  }

  // 4. Branch margin gap.
  if (input.branches.length > 1 && input.canViewCost) {
    const rows = branchComparison(orders, input.branches, range, bps).filter((r) => r.summary.marginPct !== null && r.summary.orders >= 3);
    if (rows.length > 1) {
      const sorted = [...rows].sort((a, b) => (a.summary.marginPct ?? 0) - (b.summary.marginPct ?? 0));
      const lowest = sorted[0];
      const othersSales = rows.filter((r) => r !== lowest).reduce((s, r) => s + r.summary.netSales, 0);
      const othersProfit = rows.filter((r) => r !== lowest).reduce((s, r) => s + r.summary.grossProfit, 0);
      const othersMargin = othersSales > 0 ? othersProfit / othersSales * 100 : 0;
      const gap = othersMargin - (lowest.summary.marginPct ?? 0);
      if (gap >= 1.5) {
        insights.push({
          id: 'margin-gap',
          tone: 'warning',
          title: `${lowest.branch.shortName} margin is ${gap.toFixed(1)} pts below other branches`,
          detail: `${(lowest.summary.marginPct ?? 0).toFixed(1)}% vs ${othersMargin.toFixed(1)}% gross margin this period`,
          href: '/orders'
        });
      }
    }
  }

  // 5. Dead stock — on hand with no outgoing movement for 90+ days.
  const deadSince = nowMs - 90 * DAY;
  const recentlyMoved = new Set<string>();
  for (const entry of input.ledger) {
    if (entry.change < 0 && new Date(entry.createdAt).getTime() >= deadSince) recentlyMoved.add(entry.variantId);
  }
  const warehouseIds = input.warehouses.map((w) => w.id);
  let deadValue = 0;
  let deadUnits = 0;
  const deadProducts = new Map<string, number>();
  for (const variant of input.variants) {
    const product = input.productsById.get(variant.productId);
    if (!product || product.type !== 'physical' || product.status !== 'active' || recentlyMoved.has(variant.id)) continue;
    const onHand = warehouseIds.reduce((s, w) => s + getBalance(input.balances, variant.id, w).onHand, 0);
    if (onHand <= 0) continue;
    deadUnits += onHand;
    deadValue += onHand * variant.cost;
    deadProducts.set(product.name, (deadProducts.get(product.name) ?? 0) + onHand * variant.cost);
  }
  if (deadUnits > 0) {
    const leader = Array.from(deadProducts.entries()).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'dead-stock',
      tone: 'warning',
      title: input.canViewCost ? `${formatMoney(deadValue, { compact: true })} of stock hasn't moved in 90+ days` : `${deadUnits} units haven't moved in 90+ days`,
      detail: `${deadProducts.size} product${deadProducts.size > 1 ? 's' : ''}, led by ${leader[0]}`,
      href: '/inventory?view=dead'
    });
  }

  // 6. Top product this period.
  const [top] = topProducts(orders, range, bps, 1);
  if (top && current.netSales > 0) {
    insights.push({
      id: 'top-product',
      tone: 'neutral',
      title: `${top.name} led sales this period`,
      detail: `${formatMoney(top.revenue)} from ${top.units} unit${top.units > 1 ? 's' : ''} · ${(top.revenue / current.netSales * 100).toFixed(0)}% of net sales`,
      href: `/products/${top.productId}`
    });
  }

  return insights.sort((a, b) => toneRank[a.tone] - toneRank[b.tone]);
}