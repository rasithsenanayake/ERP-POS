import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  subMonths,
  subQuarters } from
'date-fns';
import type { Product, Variant } from '../types/catalog';
import type { Branch, Warehouse } from '../types/org';
import type { Customer, Order } from '../types/sales';
import { DAY, HOUR } from './dates';
import { Balances, getBalance, availableQty } from './inventory';
import { isRevenueOrder, orderCogs, orderTotals } from './orderMath';

export type PeriodKey = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'quarter';

export const periodLabels: Record<PeriodKey, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  this_month: 'This month',
  last_month: 'Last month',
  quarter: 'This quarter'
};

export interface PeriodRange {
  key: PeriodKey;
  start: number;
  end: number;
  prevStart: number;
  prevEnd: number;
  bucket: 'hour' | 'day' | 'week';
}

export function getPeriodRange(key: PeriodKey, now: Date): PeriodRange {
  const end = now.getTime();
  switch (key) {
    case 'today':{
        const start = startOfDay(now).getTime();
        return { key, start, end, prevStart: start - DAY, prevEnd: end - DAY, bucket: 'hour' };
      }
    case '7d':{
        const start = startOfDay(addDays(now, -6)).getTime();
        return { key, start, end, prevStart: start - 7 * DAY, prevEnd: end - 7 * DAY, bucket: 'day' };
      }
    case '30d':{
        const start = startOfDay(addDays(now, -29)).getTime();
        return { key, start, end, prevStart: start - 30 * DAY, prevEnd: end - 30 * DAY, bucket: 'day' };
      }
    case 'this_month':{
        const start = startOfMonth(now).getTime();
        const prev = subMonths(now, 1);
        return { key, start, end, prevStart: startOfMonth(prev).getTime(), prevEnd: prev.getTime(), bucket: 'day' };
      }
    case 'last_month':{
        const ref = subMonths(now, 1);
        const before = subMonths(now, 2);
        return {
          key,
          start: startOfMonth(ref).getTime(),
          end: endOfMonth(ref).getTime(),
          prevStart: startOfMonth(before).getTime(),
          prevEnd: endOfMonth(before).getTime(),
          bucket: 'day'
        };
      }
    case 'quarter':{
        const start = startOfQuarter(now).getTime();
        const prev = subQuarters(now, 1);
        return { key, start, end, prevStart: startOfQuarter(prev).getTime(), prevEnd: prev.getTime(), bucket: 'week' };
      }
  }
}

export interface SalesSummary {
  netSales: number;
  orders: number;
  aov: number;
  grossProfit: number;
  marginPct: number | null;
  units: number;
}

function inRange(order: Order, start: number, end: number): boolean {
  const t = new Date(order.createdAt).getTime();
  return t >= start && t <= end;
}

export function summarize(orders: Order[], start: number, end: number, bps: number): SalesSummary {
  let netSales = 0;
  let cogs = 0;
  let count = 0;
  let units = 0;
  for (const order of orders) {
    if (!isRevenueOrder(order) || !inRange(order, start, end)) continue;
    const totals = orderTotals(order, bps);
    netSales += totals.netSales;
    cogs += orderCogs(order);
    count += 1;
    units += totals.units;
  }
  const grossProfit = netSales - cogs;
  return {
    netSales,
    orders: count,
    aov: count ? Math.round(netSales / count) : 0,
    grossProfit,
    marginPct: netSales > 0 ? grossProfit / netSales * 100 : null,
    units
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous) * 100;
}

export interface SeriesPoint {
  label: string;
  current: number | null;
  previous: number;
}

export function revenueSeries(orders: Order[], range: PeriodRange, bps: number, now: Date): SeriesPoint[] {
  const size = range.bucket === 'hour' ? HOUR : range.bucket === 'day' ? DAY : 7 * DAY;
  const count =
  range.bucket === 'hour' ?
  24 :
  range.bucket === 'day' ?
  differenceInCalendarDays(new Date(range.end), new Date(range.start)) + 1 :
  Math.ceil((range.end - range.start) / size) || 1;
  const current = new Array<number>(count).fill(0);
  const previous = new Array<number>(count).fill(0);
  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;
    const t = new Date(order.createdAt).getTime();
    const value = orderTotals(order, bps).netSales;
    if (t >= range.start && t <= range.end) {
      const index = Math.min(count - 1, Math.floor((t - range.start) / size));
      current[index] += value;
    } else if (t >= range.prevStart && t <= range.prevEnd) {
      const index = Math.floor((t - range.prevStart) / size);
      if (index >= 0 && index < count) previous[index] += value;
    }
  }
  const nowMs = now.getTime();
  return current.map((value, i) => {
    const bucketStart = range.start + i * size;
    const label =
    range.bucket === 'hour' ?
    format(new Date(bucketStart), 'h a') :
    range.bucket === 'day' ?
    format(new Date(bucketStart), 'd MMM') :
    `Wk of ${format(new Date(bucketStart), 'd MMM')}`;
    return { label, current: bucketStart > nowMs ? null : value, previous: previous[i] };
  });
}

export function receivables(orders: Order[], bps: number): {total: number;count: number;} {
  let total = 0;
  let count = 0;
  for (const order of orders) {
    const balance = orderTotals(order, bps).balance;
    if (balance > 0 && order.status !== 'draft') {
      total += balance;
      count += 1;
    }
  }
  return { total, count };
}

export function inventoryValue(balances: Balances, variants: Variant[], productsById: Map<string, Product>, warehouseIds: string[]): number {
  let total = 0;
  for (const variant of variants) {
    if (productsById.get(variant.productId)?.type !== 'physical') continue;
    for (const warehouseId of warehouseIds) total += getBalance(balances, variant.id, warehouseId).onHand * variant.cost;
  }
  return total;
}

export interface LowStockRow {
  variant: Variant;
  product: Product;
  warehouse: Warehouse;
  available: number;
  threshold: number;
}

export function lowStockRows(balances: Balances, variants: Variant[], productsById: Map<string, Product>, warehouses: Warehouse[]): LowStockRow[] {
  const rows: LowStockRow[] = [];
  for (const variant of variants) {
    const product = productsById.get(variant.productId);
    if (!product || product.type !== 'physical' || product.status !== 'active' || product.reorderPoint <= 0) continue;
    for (const warehouse of warehouses) {
      const threshold = warehouse.kind === 'central' ? product.reorderPoint * 3 : product.reorderPoint;
      const available = availableQty(getBalance(balances, variant.id, warehouse.id));
      if (available <= threshold) rows.push({ variant, product, warehouse, available, threshold });
    }
  }
  return rows.sort((a, b) => a.available - a.threshold - (b.available - b.threshold));
}

export interface BranchRow {
  branch: Branch;
  summary: SalesSummary;
  share: number;
  previous: number;
}

export function branchComparison(orders: Order[], branches: Branch[], range: PeriodRange, bps: number): BranchRow[] {
  const rows = branches.map((branch) => {
    const branchOrders = orders.filter((o) => o.branchId === branch.id);
    return {
      branch,
      summary: summarize(branchOrders, range.start, range.end, bps),
      previous: summarize(branchOrders, range.prevStart, range.prevEnd, bps).netSales,
      share: 0
    };
  });
  const total = rows.reduce((s, r) => s + r.summary.netSales, 0);
  for (const row of rows) row.share = total > 0 ? row.summary.netSales / total * 100 : 0;
  return rows.sort((a, b) => b.summary.netSales - a.summary.netSales);
}

export interface TopProductRow {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}

export function topProducts(orders: Order[], range: PeriodRange, bps: number, limit = 5): TopProductRow[] {
  const map = new Map<string, TopProductRow>();
  for (const order of orders) {
    if (!isRevenueOrder(order) || order.status === 'returned' || order.status === 'refunded') continue;
    if (!inRange(order, range.start, range.end)) continue;
    for (const item of order.items) {
      const gross = item.unitPrice * item.quantity - item.discount;
      const revenue = Math.round(gross * 10000 / (10000 + bps));
      const row = map.get(item.productId) ?? { productId: item.productId, name: item.name, units: 0, revenue: 0 };
      row.units += item.quantity;
      row.revenue += revenue;
      map.set(item.productId, row);
    }
  }
  return Array.from(map.values()).
  sort((a, b) => b.revenue - a.revenue).
  slice(0, limit);
}

export interface CustomerStats {
  ltv: number;
  orderCount: number;
  aov: number;
  outstanding: number;
  lastOrderAt: string | null;
}

export function customerStats(customer: Customer, orders: Order[], bps: number): CustomerStats {
  let ltv = 0;
  let count = 0;
  let outstanding = 0;
  let lastOrderAt: string | null = null;
  for (const order of orders) {
    if (order.customerId !== customer.id) continue;
    const totals = orderTotals(order, bps);
    outstanding += totals.balance;
    if (!isRevenueOrder(order)) continue;
    ltv += totals.netPaid;
    count += 1;
    if (!lastOrderAt || order.createdAt > lastOrderAt) lastOrderAt = order.createdAt;
  }
  return { ltv, orderCount: count, aov: count ? Math.round(ltv / count) : 0, outstanding, lastOrderAt };
}