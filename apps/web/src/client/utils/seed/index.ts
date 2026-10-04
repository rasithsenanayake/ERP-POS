import type { ErpState } from '../../types/erp';
import type { ModuleKey } from '../../types/org';
import type { AppNotification } from '../../types/system';
import { customerSeeds } from '../../data/customers';
import { moduleDefinitions } from '../../data/modules';
import { branches, company, organization, roles, users, warehouses } from '../../data/organization';
import { productSeeds } from '../../data/products';
import { DAY, HOUR, MINUTE } from '../dates';
import { availableQty } from '../inventory';
import { formatMoney } from '../money';
import { orderDueAt, orderTotals } from '../orderMath';
import { createRng } from '../random';
import { DEMO_IP } from '../domain/helpers';
import { buildCatalog } from './catalog';
import { SeedContext, SeedEvent, iso } from './context';
import { buildCustomers } from './customers';
import { addOrderEvents } from './orders';
import { addAdjustmentEvents, addOpeningEvents, addReceiptEvents, addTransferEvents } from './stock';

/**
 * Builds a realistic, internally consistent dataset by replaying business events
 * in chronological order through the same stock rules the live app uses.
 */
export function buildInitialState(now: Date): ErpState {
  const rng = createRng(20261004);
  const catalog = buildCatalog(productSeeds, rng, now);
  const customers = buildCustomers(customerSeeds, rng, now);
  const ctx: SeedContext = {
    now,
    rng,
    products: catalog.products,
    variants: catalog.variants,
    productsById: new Map(catalog.products.map((p) => [p.id, p])),
    variantsById: new Map(catalog.variants.map((v) => [v.id, v])),
    slowProductIds: catalog.slowProductIds,
    demandByProduct: catalog.demandByProduct,
    customers,
    store: { balances: {}, ledger: [], seq: 0 },
    orders: [],
    transfers: [],
    audit: [],
    counters: { order: 0, adjustment: 0, transfer: 100 }
  };

  const events: SeedEvent[] = [];
  addOpeningEvents(events, ctx);
  addReceiptEvents(events, ctx);
  addAdjustmentEvents(events, ctx);
  addTransferEvents(events, ctx);
  addOrderEvents(events, ctx);
  events.sort((a, b) => a.at - b.at);
  for (const event of events) event.run();

  // Loyalty: 1 point per Rs 100 of net sales.
  for (const customer of customers) {
    const net = ctx.orders.
    filter((o) => o.customerId === customer.id && o.status !== 'cancelled' && o.status !== 'draft').
    reduce((sum, o) => sum + orderTotals(o, company.taxRateBps).netSales, 0);
    customer.loyaltyPoints = Math.floor(net / 10_000);
  }

  const staticAudit = [
  { id: 'aud-s1', userId: 'u-nimali', action: 'role.permissions_changed', resource: 'Role', resourceId: 'salesperson', resourceLabel: 'Salesperson', createdAt: iso(now.getTime() - 41 * DAY), ip: DEMO_IP, changes: [{ field: 'products.view_cost', from: 'granted', to: 'revoked' }] },
  { id: 'aud-s2', userId: 'u-nimali', action: 'product.cost_changed', resource: 'Product', resourceId: 'p-iph15', resourceLabel: 'Apple iPhone 15 · 128GB / Black', createdAt: iso(now.getTime() - 12 * DAY), ip: DEMO_IP, changes: [{ field: 'cost', from: 'Rs 244,000', to: 'Rs 246,000' }] },
  { id: 'aud-s3', userId: 'u-nimali', action: 'user.invited', resource: 'User', resourceId: 'u-sachini', resourceLabel: 'Sachini Wickramasinghe', createdAt: iso(now.getTime() - 64 * DAY), ip: DEMO_IP, changes: [{ field: 'role', from: '—', to: 'Salesperson' }] }];

  const audit = [...ctx.audit, ...staticAudit].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const notifications = buildSeedNotifications(ctx, now);
  const modules = Object.fromEntries(moduleDefinitions.map((m) => [m.key, m.defaultEnabled])) as Record<ModuleKey, boolean>;

  return {
    organization,
    company,
    branches,
    warehouses,
    users,
    roles,
    products: ctx.products,
    variants: ctx.variants,
    customers,
    orders: ctx.orders,
    balances: ctx.store.balances,
    ledger: ctx.store.ledger,
    transfers: ctx.transfers.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    notifications,
    audit,
    modules,
    sequences: {
      order: ctx.counters.order,
      customer: customers.length,
      transfer: ctx.counters.transfer,
      adjustment: ctx.counters.adjustment,
      product: ctx.products.length,
      ledger: ctx.store.seq
    }
  };
}

function buildSeedNotifications(ctx: SeedContext, now: Date): AppNotification[] {
  const list: AppNotification[] = [];
  const lows: {title: string;body: string;href: string;}[] = [];
  for (const variant of ctx.variants) {
    const product = ctx.productsById.get(variant.productId)!;
    if (product.type !== 'physical' || product.status !== 'active') continue;
    for (const warehouse of warehouses.filter((w) => w.kind === 'store')) {
      const balance = ctx.store.balances[`${variant.id}@${warehouse.id}`];
      if (!balance) continue;
      const available = availableQty(balance);
      if (available <= product.reorderPoint) {
        lows.push({
          title: `Low stock: ${product.name}${variant.title !== 'Default' ? ` · ${variant.title}` : ''}`,
          body: `${available} available at ${warehouse.name} · reorder point ${product.reorderPoint}`,
          href: `/products/${product.id}`
        });
      }
    }
  }
  lows.slice(0, 3).forEach((low, i) => list.push({ id: `ntf-low-${i}`, kind: 'low_stock', ...low, createdAt: iso(now.getTime() - (i + 1) * 47 * MINUTE), read: i > 0 }));

  const paid = ctx.orders.
  filter((o) => o.payments.some((p) => p.kind === 'payment')).
  sort((a, b) => b.createdAt.localeCompare(a.createdAt)).
  slice(0, 3);
  paid.forEach((order, i) => {
    const last = order.payments.filter((p) => p.kind === 'payment').slice(-1)[0];
    list.push({ id: `ntf-pay-${i}`, kind: 'payment', title: 'Payment received', body: `${formatMoney(last.amount)} for ${order.number}`, href: `/orders/${order.id}`, createdAt: last.createdAt, read: i > 0 });
  });

  const requested = ctx.transfers.find((t) => t.status === 'requested');
  if (requested) {
    list.push({ id: 'ntf-trf', kind: 'transfer', title: `${requested.number} awaiting approval`, body: 'Requested by Kasun Jayawardena', href: '/inventory/transfers', createdAt: requested.history[requested.history.length - 1].at, read: false });
  }

  const overdue = ctx.orders.
  map((o) => {
    const customer = ctx.customers.find((c) => c.id === o.customerId);
    const balance = orderTotals(o, company.taxRateBps).balance;
    return { o, customer, balance, due: orderDueAt(o, customer) };
  }).
  filter((x) => x.customer && x.balance > 0 && x.due < now.getTime() && x.o.status === 'fulfilled').
  sort((a, b) => b.balance - a.balance)[0];
  if (overdue?.customer) {
    list.push({ id: 'ntf-overdue', kind: 'overdue', title: `${overdue.customer.company || overdue.customer.name} is overdue`, body: `${formatMoney(overdue.balance)} on ${overdue.o.number}`, href: `/customers/${overdue.customer.id}`, createdAt: iso(now.getTime() - 5 * HOUR), read: true });
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}