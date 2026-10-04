import type { ErpState } from '../types/erp';
import type { Lookups } from '../contexts/ErpContext';
import type { Order } from '../types/sales';
import { DAY } from './dates';
import { channelLabels } from './labels';
import { isRevenueOrder, orderCogs, orderTotals } from './orderMath';

export type ReportId = 'product' | 'branch' | 'channel' | 'salesperson' | 'inventory' | 'balances';

export interface ReportColumn {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'money' | 'percent';
}

export type ReportRow = Record<string, string | number>;

export interface ReportDefinition {
  id: ReportId;
  name: string;
  description: string;
  group: 'Sales' | 'Inventory' | 'Receivables';
  usesPeriod: boolean;
  requiresCost: boolean;
  columns: ReportColumn[];
  /** Column charted as bars. */
  chartKey: string;
}

export const reportDefinitions: ReportDefinition[] = [
{
  id: 'product', name: 'Sales by product', description: 'Units, net sales and gross profit per product.', group: 'Sales', usesPeriod: true, requiresCost: true, chartKey: 'netSales',
  columns: [{ key: 'label', label: 'Product', kind: 'text' }, { key: 'units', label: 'Units', kind: 'number' }, { key: 'netSales', label: 'Net sales', kind: 'money' }, { key: 'profit', label: 'Gross profit', kind: 'money' }, { key: 'margin', label: 'Margin', kind: 'percent' }]
},
{
  id: 'branch', name: 'Sales by branch', description: 'Orders, average order value and margin per store.', group: 'Sales', usesPeriod: true, requiresCost: true, chartKey: 'netSales',
  columns: [{ key: 'label', label: 'Branch', kind: 'text' }, { key: 'orders', label: 'Orders', kind: 'number' }, { key: 'aov', label: 'Avg. order', kind: 'money' }, { key: 'netSales', label: 'Net sales', kind: 'money' }, { key: 'margin', label: 'Margin', kind: 'percent' }]
},
{
  id: 'channel', name: 'Sales by channel', description: 'How in-store, online, phone and wholesale compare.', group: 'Sales', usesPeriod: true, requiresCost: false, chartKey: 'netSales',
  columns: [{ key: 'label', label: 'Channel', kind: 'text' }, { key: 'orders', label: 'Orders', kind: 'number' }, { key: 'aov', label: 'Avg. order', kind: 'money' }, { key: 'netSales', label: 'Net sales', kind: 'money' }, { key: 'share', label: 'Share', kind: 'percent' }]
},
{
  id: 'salesperson', name: 'Sales by salesperson', description: 'Orders and net sales assigned to each team member.', group: 'Sales', usesPeriod: true, requiresCost: false, chartKey: 'netSales',
  columns: [{ key: 'label', label: 'Salesperson', kind: 'text' }, { key: 'orders', label: 'Orders', kind: 'number' }, { key: 'aov', label: 'Avg. order', kind: 'money' }, { key: 'netSales', label: 'Net sales', kind: 'money' }]
},
{
  id: 'inventory', name: 'Inventory valuation', description: 'Units on hand and value at cost by category.', group: 'Inventory', usesPeriod: false, requiresCost: true, chartKey: 'value',
  columns: [{ key: 'label', label: 'Category', kind: 'text' }, { key: 'skus', label: 'SKUs', kind: 'number' }, { key: 'units', label: 'Units on hand', kind: 'number' }, { key: 'value', label: 'Value at cost', kind: 'money' }]
},
{
  id: 'balances', name: 'Customer balances', description: 'Outstanding amounts owed, largest first.', group: 'Receivables', usesPeriod: false, requiresCost: false, chartKey: 'balance',
  columns: [{ key: 'label', label: 'Customer', kind: 'text' }, { key: 'orders', label: 'Open orders', kind: 'number' }, { key: 'balance', label: 'Outstanding', kind: 'money' }]
}];


interface Acc {
  label: string;
  orders: number;
  units: number;
  netSales: number;
  cogs: number;
}

function groupOrders(orders: Order[], bps: number, keyOf: (o: Order) => {key: string;label: string;}): ReportRow[] {
  const map = new Map<string, Acc>();
  for (const o of orders) {
    const { key, label } = keyOf(o);
    const t = orderTotals(o, bps);
    const acc = map.get(key) ?? { label, orders: 0, units: 0, netSales: 0, cogs: 0 };
    acc.orders += 1;
    acc.units += t.units;
    acc.netSales += t.netSales;
    acc.cogs += orderCogs(o);
    map.set(key, acc);
  }
  const total = Array.from(map.values()).reduce((s, a) => s + a.netSales, 0);
  return Array.from(map.values()).map((a) => ({
    label: a.label,
    orders: a.orders,
    units: a.units,
    netSales: a.netSales,
    aov: a.orders ? Math.round(a.netSales / a.orders) : 0,
    margin: a.netSales ? (a.netSales - Math.round(a.cogs * 10000 / (10000 + bps))) / a.netSales * 100 : 0,
    share: total ? a.netSales / total * 100 : 0
  }));
}

export function runReport(id: ReportId, state: ErpState, orders: Order[], lookups: Lookups, periodDays: number, warehouseIds: string[]): ReportRow[] {
  const bps = state.company.taxRateBps;
  const from = Date.now() - periodDays * DAY;
  const inPeriod = orders.filter((o) => isRevenueOrder(o) && new Date(o.createdAt).getTime() >= from);

  let rows: ReportRow[] = [];
  if (id === 'branch') rows = groupOrders(inPeriod, bps, (o) => ({ key: o.branchId, label: lookups.branchesById.get(o.branchId)?.name ?? o.branchId }));
  if (id === 'channel') rows = groupOrders(inPeriod, bps, (o) => ({ key: o.channel, label: channelLabels[o.channel] }));
  if (id === 'salesperson') rows = groupOrders(inPeriod, bps, (o) => ({ key: o.assignedTo, label: lookups.usersById.get(o.assignedTo)?.name ?? '—' }));

  if (id === 'product') {
    const map = new Map<string, {label: string;units: number;gross: number;cost: number;}>();
    for (const o of inPeriod) {
      const t = orderTotals(o, bps);
      const ratio = t.subtotal ? t.netSales / t.subtotal : 0;
      const costed = orderCogs(o) > 0;
      for (const item of o.items) {
        const acc = map.get(item.productId) ?? { label: item.name, units: 0, gross: 0, cost: 0 };
        acc.units += item.quantity;
        acc.gross += Math.round(item.unitPrice * item.quantity * ratio);
        if (costed) acc.cost += Math.round(item.unitCost * item.quantity * 10000 / (10000 + bps));
        map.set(item.productId, acc);
      }
    }
    rows = Array.from(map.values()).map((a) => ({ label: a.label, units: a.units, netSales: a.gross, profit: a.gross - a.cost, margin: a.gross ? (a.gross - a.cost) / a.gross * 100 : 0 }));
  }

  if (id === 'inventory') {
    const map = new Map<string, {label: string;skus: Set<string>;units: number;value: number;}>();
    for (const b of Object.values(state.balances)) {
      if (!warehouseIds.includes(b.warehouseId) || b.onHand <= 0) continue;
      const v = lookups.variantsById.get(b.variantId);
      const p = v ? lookups.productsById.get(v.productId) : undefined;
      if (!v || !p) continue;
      const acc = map.get(p.category) ?? { label: p.category, skus: new Set<string>(), units: 0, value: 0 };
      acc.skus.add(v.id);
      acc.units += b.onHand;
      acc.value += b.onHand * v.cost;
      map.set(p.category, acc);
    }
    rows = Array.from(map.values()).map((a) => ({ label: a.label, skus: a.skus.size, units: a.units, value: a.value }));
  }

  if (id === 'balances') {
    const map = new Map<string, {label: string;orders: number;balance: number;}>();
    for (const o of orders) {
      const bal = orderTotals(o, bps).balance;
      if (bal <= 0) continue;
      const key = o.customerId ?? 'walk-in';
      const acc = map.get(key) ?? { label: o.customerId ? lookups.customersById.get(o.customerId)?.name ?? '—' : 'Walk-in customers', orders: 0, balance: 0 };
      acc.orders += 1;
      acc.balance += bal;
      map.set(key, acc);
    }
    rows = Array.from(map.values()).map((a) => ({ ...a }));
  }

  const chartKey = reportDefinitions.find((r) => r.id === id)!.chartKey;
  return rows.sort((a, b) => Number(b[chartKey]) - Number(a[chartKey]));
}