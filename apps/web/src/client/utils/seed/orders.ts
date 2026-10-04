import type { Variant } from '../../types/catalog';
import type { Order, OrderItem, OrderStatus, Payment, PaymentMethod, PaymentStatus, SalesChannel, TimelineEvent } from '../../types/sales';
import { branches, company, users } from '../../data/organization';
import { DAY, HOUR, MINUTE } from '../dates';
import { expandToStockLines } from '../inventory';
import { formatMoney } from '../money';
import { derivePaymentStatus, orderTotals } from '../orderMath';
import { pick, randInt, weighted } from '../random';
import { DEMO_IP } from '../domain/helpers';
import { canSupply, iso, SeedContext, SeedEvent, seedMove, seedReserve } from './context';
import { salesTeam } from './customers';

const ORDER_COUNT = 150;
type Flavor = 'normal' | 'partial_refund';

const methodText: Record<PaymentMethod, string> = { cash: 'cash', card: 'card', bank_transfer: 'bank transfer', qr: 'LankaQR' };

const seedNotes = [
'Customer asked for gift wrapping.',
'Called customer — will collect after 5pm.',
'Requested VAT invoice with company name.',
'@Nimali customer is asking about trade-in for their old phone.',
'Warranty card and receipt handed over.'];


function firstName(userId: string): string {
  return users.find((u) => u.id === userId)?.name.split(' ')[0] ?? '';
}

function pickVariant(ctx: SeedContext, pool: Variant[]): Variant {
  return weighted(
    ctx.rng,
    pool.map((v) => ({ value: v, weight: ctx.demandByProduct.get(v.productId) ?? 1 }))
  );
}

export function addOrderEvents(events: SeedEvent[], ctx: SeedContext): void {
  const { rng, now } = ctx;
  for (let i = 0; i < ORDER_COUNT; i++) {
    let at: number;
    if (i < 7) {
      at = now.getTime() - (i + 1) * 41 * MINUTE - randInt(rng, 0, 9) * MINUTE;
    } else {
      const daysAgo = 1 + Math.floor(Math.pow(rng(), 1.15) * 89);
      const d = new Date(now.getTime() - daysAgo * DAY);
      d.setHours(9 + randInt(rng, 0, 10), randInt(rng, 0, 59), 0, 0);
      at = d.getTime();
    }
    const ageDays = (now.getTime() - at) / DAY;
    let status: OrderStatus;
    let flavor: Flavor = 'normal';
    if (ageDays > 3) {
      const r = rng();
      if (r < 0.8) status = 'fulfilled';else
      if (r < 0.86) status = 'cancelled';else
      if (r < 0.9) status = 'returned';else
      if (r < 0.93) status = 'refunded';else
      {
        status = 'fulfilled';
        flavor = 'partial_refund';
      }
    } else {
      status = weighted(rng, [
      { value: 'pending' as OrderStatus, weight: 18 },
      { value: 'confirmed' as OrderStatus, weight: 20 },
      { value: 'processing' as OrderStatus, weight: 14 },
      { value: 'ready' as OrderStatus, weight: 10 },
      { value: 'fulfilled' as OrderStatus, weight: 32 },
      { value: 'draft' as OrderStatus, weight: 6 }]
      );
    }
    const holder: {order: Order | null;} = { order: null };
    events.push({ at, run: () => {holder.order = createSeedOrder(ctx, at, status, flavor);} });
    if (status === 'returned') {
      const returnAt = Math.min(now.getTime() - HOUR, at + 3 * DAY);
      events.push({
        at: returnAt,
        run: () => {
          const order = holder.order;
          if (!order) return;
          const lines = expandToStockLines(order.items, ctx.variantsById, ctx.productsById);
          for (const line of lines) {
            seedMove(ctx, {
              variantId: line.variantId,
              productId: line.productId,
              warehouseId: order.warehouseId,
              change: line.quantity,
              type: 'return',
              reference: { kind: 'order', id: order.id, label: order.number },
              userId: order.assignedTo,
              reason: 'Customer return — unopened',
              at: iso(returnAt)
            });
          }
        }
      });
    }
  }
}

function createSeedOrder(ctx: SeedContext, at: number, status: OrderStatus, flavor: Flavor): Order | null {
  const { rng, now } = ctx;
  const branchId = weighted(rng, [
  { value: 'br-col', weight: 45 },
  { value: 'br-kdy', weight: 33 },
  { value: 'br-gal', weight: 22 }]
  );
  const branch = branches.find((b) => b.id === branchId)!;
  const warehouseId = branch.warehouseId;
  const channel: SalesChannel = weighted(rng, [
  { value: 'in_store' as SalesChannel, weight: 55 },
  { value: 'online' as SalesChannel, weight: 25 },
  { value: 'phone' as SalesChannel, weight: 10 },
  { value: 'wholesale' as SalesChannel, weight: 10 }]
  );
  const retailCustomers = ctx.customers.filter((c) => !c.tags.includes('Wholesale'));
  let customer = null as (typeof ctx.customers)[number] | null;
  if (channel === 'wholesale') {
    const pool = ctx.customers.filter((c) => c.tags.includes('Wholesale'));
    const local = pool.filter((c) => c.branchId === branchId);
    customer = pick(rng, local.length ? local : pool);
  } else if (channel === 'in_store' && rng() < 0.35) {
    customer = null;
  } else {
    const local = retailCustomers.filter((c) => c.branchId === branchId);
    customer = pick(rng, rng() < 0.85 && local.length ? local : retailCustomers);
  }

  const needsStock = ['fulfilled', 'returned', 'confirmed', 'processing', 'ready'].includes(status);
  const sellable = ctx.variants.filter((v) => {
    const p = ctx.productsById.get(v.productId)!;
    return p.status === 'active' && p.type !== 'service' && !ctx.slowProductIds.has(p.id) && (ctx.demandByProduct.get(p.id) ?? 0) > 0;
  });
  const accessories = sellable.filter((v) => ['Accessories', 'Smart Home'].includes(ctx.productsById.get(v.productId)!.category) || v.wholesalePrice);
  const lineCount = channel === 'wholesale' ? randInt(rng, 2, 3) : weighted(rng, [{ value: 1, weight: 60 }, { value: 2, weight: 30 }, { value: 3, weight: 10 }]);
  const chosen = new Map<string, number>();
  for (let attempt = 0; attempt < lineCount * 5 && chosen.size < lineCount; attempt++) {
    const variant = pickVariant(ctx, channel === 'wholesale' ? accessories.filter((v) => v.wholesalePrice) : sellable);
    if (chosen.has(variant.id)) continue;
    const product = ctx.productsById.get(variant.productId)!;
    const quantity = channel === 'wholesale' ? randInt(rng, 4, 12) : product.category === 'Accessories' ? randInt(rng, 1, 2) : 1;
    const candidate = new Map(chosen);
    candidate.set(variant.id, quantity);
    if (needsStock) {
      const lines = expandToStockLines(Array.from(candidate, ([variantId, q]) => ({ variantId, quantity: q })), ctx.variantsById, ctx.productsById);
      if (!canSupply(ctx, lines, warehouseId)) continue;
    }
    chosen.set(variant.id, quantity);
  }
  if (chosen.size === 0) return null;
  const hasDevice = Array.from(chosen.keys()).some((id) => ['Phones', 'Laptops'].includes(ctx.productsById.get(ctx.variantsById.get(id)!.productId)!.category));
  if (channel !== 'wholesale' && hasDevice && rng() < 0.18) chosen.set('p-care-v1', 1);

  const vip = customer?.tags.includes('VIP') ?? false;
  const items: OrderItem[] = Array.from(chosen, ([variantId, quantity], index) => {
    const variant = ctx.variantsById.get(variantId)!;
    const product = ctx.productsById.get(variant.productId)!;
    const unitPrice = channel === 'wholesale' && variant.wholesalePrice ? variant.wholesalePrice : variant.price;
    const discount = vip && rng() < 0.4 ? Math.round(unitPrice * quantity * 0.05 / 10000) * 10000 : 0;
    return {
      id: `oli-${ctx.counters.order + 1}-${index}`,
      productId: product.id,
      variantId,
      name: product.name,
      variantTitle: variant.title,
      sku: variant.sku,
      quantity,
      unitPrice,
      unitCost: variant.cost,
      discount
    };
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const orderDiscount = channel !== 'wholesale' && rng() < 0.08 ? Math.min(randInt(rng, 1, 5) * 100_000, Math.floor(subtotal / 10)) : 0;
  const shipping = channel === 'online' ? subtotal > 5_000_000 ? 0 : 45_000 : channel === 'phone' && rng() < 0.5 ? 35_000 : 0;
  const assignedTo = pick(rng, salesTeam[branchId]);
  const createdBy = channel === 'online' ? 'u-system' : assignedTo;

  ctx.counters.order += 1;
  const number = `ORD-${1000 + ctx.counters.order}`;
  const id = `ord-${ctx.counters.order}`;
  const stockLines = expandToStockLines(items, ctx.variantsById, ctx.productsById);
  const fulfilledAt = Math.min(now.getTime() - MINUTE, at + (channel === 'in_store' ? 3 : randInt(rng, 40, 240)) * MINUTE);

  if (status === 'fulfilled' || status === 'returned') {
    for (const line of stockLines) {
      seedMove(ctx, {
        variantId: line.variantId,
        productId: line.productId,
        warehouseId,
        change: -line.quantity,
        type: 'sale',
        reference: { kind: 'order', id, label: number },
        userId: assignedTo,
        reason: 'Order fulfilled',
        at: iso(fulfilledAt)
      });
    }
  } else if (['confirmed', 'processing', 'ready'].includes(status)) {
    seedReserve(ctx, stockLines, warehouseId);
  }

  const draft: Order = {
    id,
    number,
    channel,
    customerId: customer?.id ?? null,
    branchId,
    warehouseId,
    status,
    paymentStatus: 'unpaid',
    items,
    orderDiscount,
    shipping,
    payments: [],
    assignedTo,
    createdBy,
    customerNote: channel === 'online' && rng() < 0.25 ? 'Please call before delivery.' : '',
    createdAt: iso(at),
    fulfilledAt: status === 'fulfilled' || status === 'returned' ? iso(fulfilledAt) : null,
    timeline: []
  };
  const totals = orderTotals(draft, company.taxRateBps);
  const business = customer ? customer.tags.includes('Wholesale') || customer.tags.includes('Corporate') : false;
  const method: PaymentMethod =
  channel === 'wholesale' ?
  'bank_transfer' :
  channel === 'online' ?
  weighted(rng, [{ value: 'card' as PaymentMethod, weight: 70 }, { value: 'bank_transfer' as PaymentMethod, weight: 30 }]) :
  channel === 'phone' ?
  weighted(rng, [{ value: 'bank_transfer' as PaymentMethod, weight: 60 }, { value: 'card' as PaymentMethod, weight: 40 }]) :
  weighted(rng, [{ value: 'cash' as PaymentMethod, weight: 40 }, { value: 'card' as PaymentMethod, weight: 45 }, { value: 'qr' as PaymentMethod, weight: 15 }]);

  const payments: Payment[] = [];
  const timeline: TimelineEvent[] = [];
  let overrideStatus: PaymentStatus | null = null;
  const pay = (amount: number, when: number) => {
    payments.push({ id: `${id}-pay-${payments.length}`, kind: 'payment', amount, method, reference: method === 'bank_transfer' ? `BOC${randInt(rng, 100000, 999999)}` : '', createdAt: iso(when), userId: createdBy === 'u-system' ? 'u-system' : assignedTo });
    timeline.push({ id: `${id}-tl-pay-${payments.length}`, type: 'payment', message: `Payment of ${formatMoney(amount, { decimals: true })} received by ${methodText[method]}`, userId: createdBy === 'u-system' ? 'u-system' : assignedTo, createdAt: iso(when) });
  };
  const refund = (amount: number, when: number, reason: string) => {
    payments.push({ id: `${id}-rfd-${payments.length}`, kind: 'refund', amount, method, reference: reason, createdAt: iso(when), userId: 'u-nimali' });
    timeline.push({ id: `${id}-tl-rfd-${payments.length}`, type: 'refund', message: `Refund of ${formatMoney(amount, { decimals: true })} issued — ${reason}`, userId: 'u-nimali', createdAt: iso(when) });
    ctx.audit.push({
      id: `aud-${id}-refund-${payments.length}`,
      userId: 'u-nimali',
      action: 'order.refunded',
      resource: 'Order',
      resourceId: id,
      resourceLabel: number,
      createdAt: iso(when),
      ip: DEMO_IP,
      changes: [{ field: 'refund amount', from: '—', to: formatMoney(amount, { decimals: true }) }]
    });
  };

  const createdMessage =
  channel === 'online' ? 'Order placed on serendib.lk' : channel === 'phone' ? `Phone order taken by ${firstName(assignedTo)}` : channel === 'wholesale' ? 'Wholesale order created' : `Order created at ${branch.name}`;
  timeline.push({ id: `${id}-tl-created`, type: 'created', message: status === 'draft' ? 'Draft order created' : createdMessage, userId: createdBy, createdAt: iso(at) });

  const payAt = at + 2 * MINUTE;
  if (status === 'fulfilled' || status === 'returned') {
    if (status === 'fulfilled' && business && flavor === 'normal') {
      const r = rng();
      if (r < 0.4) {

        /* unpaid on account */} else if (r < 0.65) pay(Math.round(totals.total / 2 / 100_000) * 100_000, fulfilledAt + 2 * DAY < now.getTime() ? fulfilledAt + 2 * DAY : fulfilledAt);else
      pay(totals.total, Math.min(now.getTime() - MINUTE, fulfilledAt + 5 * DAY));
    } else {
      pay(totals.total, channel === 'in_store' ? payAt : at + 5 * MINUTE);
    }
  } else if (['confirmed', 'processing', 'ready'].includes(status)) {
    if (!(channel === 'phone' && rng() < 0.5) && !business) pay(totals.total, payAt);
  } else if (status === 'pending') {
    if (channel === 'online') {
      const r = rng();
      if (r < 0.3) {
        overrideStatus = 'failed';
        timeline.push({ id: `${id}-tl-failed`, type: 'failed', message: 'Card payment declined by issuing bank', userId: 'u-system', createdAt: iso(at + MINUTE) });
      } else if (r < 0.7) overrideStatus = 'pending';
    }
  } else if (status === 'refunded') {
    pay(totals.total, payAt);
  }

  if (['confirmed', 'processing', 'ready'].includes(status)) {
    timeline.push({ id: `${id}-tl-confirmed`, type: 'confirmed', message: `Order confirmed and stock reserved at ${branch.shortName} stockroom`, userId: assignedTo, createdAt: iso(at + 4 * MINUTE) });
  }
  if (status === 'processing' || status === 'ready') {
    timeline.push({ id: `${id}-tl-picking`, type: 'status', message: 'Picking started', userId: assignedTo, createdAt: iso(Math.min(now.getTime() - MINUTE, at + 30 * MINUTE)) });
  }
  if (status === 'ready') {
    timeline.push({ id: `${id}-tl-ready`, type: 'status', message: channel === 'in_store' || channel === 'phone' ? 'Ready for collection' : 'Packed and ready to ship', userId: assignedTo, createdAt: iso(Math.min(now.getTime() - MINUTE, at + 50 * MINUTE)) });
  }
  if (status === 'fulfilled' || status === 'returned') {
    const shipped = channel !== 'in_store';
    timeline.push({
      id: `${id}-tl-fulfilled`,
      type: 'fulfilled',
      message: shipped ? 'Packed and dispatched via Pronto Lanka Couriers' : 'Items handed over to customer',
      userId: assignedTo,
      createdAt: iso(fulfilledAt),
      meta: shipped ? { Tracking: `PRT${randInt(rng, 10000000, 99999999)}` } : undefined
    });
    if (channel === 'online') {
      timeline.push({ id: `${id}-tl-notified`, type: 'notified', message: 'Shipping confirmation emailed to customer', userId: 'u-system', createdAt: iso(fulfilledAt + MINUTE) });
    }
  }
  if (status === 'cancelled') {
    timeline.push({ id: `${id}-tl-cancelled`, type: 'cancelled', message: `Order cancelled — ${pick(rng, ['Customer changed their mind', 'Out of stock at time of order', 'Duplicate order'])}`, userId: assignedTo, createdAt: iso(at + 3 * HOUR) });
  }
  if (status === 'returned') {
    const when = Math.min(now.getTime() - HOUR, at + 3 * DAY);
    refund(totals.total, when, 'Customer return — unopened');
    timeline.push({ id: `${id}-tl-returned`, type: 'returned', message: 'Items returned and restocked', userId: assignedTo, createdAt: iso(when) });
  }
  if (status === 'refunded') {
    refund(totals.total, Math.min(now.getTime() - HOUR, at + DAY), 'Customer cancelled after payment');
  }
  if (flavor === 'partial_refund') {
    const portion = Math.max(100_000, Math.round(totals.total / 10 / 10_000) * 10_000);
    refund(Math.min(portion, totals.total), Math.min(now.getTime() - HOUR, at + 2 * DAY), 'Price match adjustment');
  }
  if (rng() < 0.12 && status !== 'draft') {
    const body = pick(rng, seedNotes);
    timeline.push({ id: `${id}-tl-note`, type: 'note', message: body, userId: assignedTo, createdAt: iso(Math.min(now.getTime() - MINUTE, at + 20 * MINUTE)), meta: body.includes('@Nimali') ? { Mentions: 'Nimali Perera' } : undefined });
  }

  timeline.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const paid = payments.filter((p) => p.kind === 'payment').reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter((p) => p.kind === 'refund').reduce((s, p) => s + p.amount, 0);
  const order: Order = { ...draft, payments, timeline, paymentStatus: overrideStatus ?? derivePaymentStatus(totals.total, paid, refunded) };
  ctx.orders.push(order);
  return order;
}