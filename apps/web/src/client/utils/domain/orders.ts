import type { ErpState } from '../../types/erp';
import type { Order, OrderItem, PaymentMethod, SalesChannel } from '../../types/sales';
import { DomainError } from '../errors';
import { createId } from '../ids';
import { applyMovement, availableQty, changeReservation, expandToStockLines, getBalance } from '../inventory';
import { formatMoney } from '../money';
import { derivePaymentStatus, isOpenForFulfilment, isReservedStatus, orderTotals } from '../orderMath';
import { canAccessOrder } from '../permissions';
import {
  assertCan,
  checkLowStock,
  DomainContext,
  DomainResult,
  mapsOf,
  stockStoreOf,
  timelineEvent,
  withAudit,
  withNotification,
  withStockStore } from
'./helpers';

export interface NewOrderInput {
  customerId: string | null;
  branchId: string;
  channel: SalesChannel;
  lines: {variantId: string;quantity: number;}[];
  orderDiscount: number;
  customerNote: string;
  confirm: boolean;
}

export const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  qr: 'LankaQR'
};

function getOrder(state: ErpState, orderId: string, ctx: DomainContext): Order {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new DomainError('NOT_FOUND', 'This order no longer exists.');
  if (!canAccessOrder(order, ctx.user, ctx.role)) throw new DomainError('FORBIDDEN', "This order is outside your access scope.");
  return order;
}

function replaceOrder(state: ErpState, order: Order): ErpState {
  return { ...state, orders: state.orders.map((o) => o.id === order.id ? order : o) };
}

function reserveForOrder(state: ErpState, order: Order, direction: 1 | -1): ErpState {
  const { variantsById, productsById } = mapsOf(state);
  let balances = state.balances;
  for (const line of expandToStockLines(order.items, variantsById, productsById)) {
    const label = productsById.get(line.productId)?.name;
    balances = changeReservation(balances, line.variantId, order.warehouseId, line.quantity * direction, label);
  }
  return { ...state, balances };
}

export function createOrder(state: ErpState, input: NewOrderInput, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.create');
  const lines = input.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) throw new DomainError('VALIDATION', 'Add at least one product to the order.');
  const branch = state.branches.find((b) => b.id === input.branchId);
  if (!branch) throw new DomainError('VALIDATION', 'Choose a branch for this order.');
  if (ctx.role.scope === 'BRANCH' && branch.id !== ctx.user.branchId) {
    throw new DomainError('FORBIDDEN', 'You can only create orders for your own branch.');
  }
  const { variantsById, productsById } = mapsOf(state);
  const items: OrderItem[] = lines.map((line) => {
    const variant = variantsById.get(line.variantId);
    if (!variant) throw new DomainError('VALIDATION', 'One of the selected products no longer exists.');
    const product = productsById.get(variant.productId)!;
    if (product.status !== 'active') throw new DomainError('VALIDATION', `${product.name} isn't active and can't be sold.`);
    const unitPrice = input.channel === 'wholesale' && variant.wholesalePrice ? variant.wholesalePrice : variant.price;
    return {
      id: createId('oli'),
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      sku: variant.sku,
      quantity: line.quantity,
      unitPrice,
      unitCost: variant.cost,
      discount: 0
    };
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  if (input.orderDiscount < 0 || input.orderDiscount > subtotal) {
    throw new DomainError('VALIDATION', 'The discount can’t be more than the order subtotal.');
  }
  const at = ctx.now.toISOString();
  const seq = state.sequences.order + 1;
  const number = `ORD-${1000 + seq}`;
  const timeline = [timelineEvent('created', input.confirm ? `Order created at ${branch.name}` : 'Draft order created', ctx.user.id, at)];
  let order: Order = {
    id: createId('ord'),
    number,
    channel: input.channel,
    customerId: input.customerId,
    branchId: branch.id,
    warehouseId: branch.warehouseId,
    status: input.confirm ? 'confirmed' : 'draft',
    paymentStatus: 'unpaid',
    items,
    orderDiscount: input.orderDiscount,
    shipping: 0,
    payments: [],
    assignedTo: ctx.user.id,
    createdBy: ctx.user.id,
    customerNote: input.customerNote.trim(),
    createdAt: at,
    fulfilledAt: null,
    timeline
  };
  let next: ErpState = { ...state, orders: [...state.orders, order], sequences: { ...state.sequences, order: seq } };
  if (input.confirm) {
    next = reserveForOrder(next, order, 1);
    order = { ...order, timeline: [...order.timeline, timelineEvent('confirmed', `Stock reserved at ${state.warehouses.find((w) => w.id === branch.warehouseId)?.name}`, ctx.user.id, at)] };
    next = replaceOrder(next, order);
  }
  next = withAudit(next, ctx, { action: 'order.created', resource: 'Order', resourceId: order.id, resourceLabel: number, changes: [] });
  return { state: next, result: order };
}

export function confirmOrder(state: ErpState, orderId: string, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.update');
  const order = getOrder(state, orderId, ctx);
  if (order.status !== 'draft' && order.status !== 'pending') {
    throw new DomainError('INVALID_STATE', 'Only draft or pending orders can be confirmed.');
  }
  let next = reserveForOrder(state, order, 1);
  const at = ctx.now.toISOString();
  const warehouse = state.warehouses.find((w) => w.id === order.warehouseId);
  const updated: Order = {
    ...order,
    status: 'confirmed',
    timeline: [...order.timeline, timelineEvent('confirmed', `Order confirmed and stock reserved at ${warehouse?.name}`, ctx.user.id, at)]
  };
  next = replaceOrder(next, updated);
  next = withAudit(next, ctx, {
    action: 'order.confirmed',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [{ field: 'status', from: order.status, to: 'confirmed' }]
  });
  return { state: next, result: updated };
}

export interface PaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export function recordPayment(state: ErpState, input: PaymentInput, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'payments.record');
  const order = getOrder(state, input.orderId, ctx);
  if (['cancelled', 'refunded', 'returned'].includes(order.status)) {
    throw new DomainError('INVALID_STATE', `You can't record a payment on a ${order.status} order.`);
  }
  if (order.status === 'draft') throw new DomainError('INVALID_STATE', 'Confirm this draft before taking payment.');
  const totals = orderTotals(order, state.company.taxRateBps);
  if (input.amount <= 0) throw new DomainError('VALIDATION', 'Enter a payment amount greater than zero.');
  if (input.amount > totals.balance) {
    throw new DomainError('LIMIT_EXCEEDED', `Amount exceeds the outstanding balance of ${formatMoney(totals.balance, { decimals: true })}.`);
  }
  const at = ctx.now.toISOString();
  const payments = [
  ...order.payments,
  { id: createId('pay'), kind: 'payment' as const, amount: input.amount, method: input.method, reference: input.reference.trim(), createdAt: at, userId: ctx.user.id }];

  const paid = totals.paid + input.amount;
  const paymentStatus = derivePaymentStatus(totals.total, paid, totals.refunded);
  const updated: Order = {
    ...order,
    payments,
    paymentStatus,
    timeline: [
    ...order.timeline,
    timelineEvent('payment', `Payment of ${formatMoney(input.amount, { decimals: true })} received by ${methodLabels[input.method].toLowerCase()}`, ctx.user.id, at, input.reference ? { Reference: input.reference } : undefined)]

  };
  let next = replaceOrder(state, updated);
  next = withNotification(next, ctx.now, {
    kind: 'payment',
    title: 'Payment received',
    body: `${formatMoney(input.amount)} for ${order.number}`,
    href: `/orders/${order.id}`
  });
  next = withAudit(next, ctx, {
    action: 'payment.recorded',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [{ field: 'payment status', from: order.paymentStatus, to: paymentStatus }]
  });
  return { state: next, result: updated };
}

export function fulfilOrder(state: ErpState, orderId: string, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.update');
  const order = getOrder(state, orderId, ctx);
  if (!isOpenForFulfilment(order.status)) {
    throw new DomainError('INVALID_STATE', order.status === 'draft' ? 'Confirm this draft before fulfilling it.' : `${order.number} is already ${order.status}.`);
  }
  const reserved = isReservedStatus(order.status);
  const { variantsById, productsById } = mapsOf(state);
  const at = ctx.now.toISOString();
  let store = stockStoreOf(state);
  const touched: {variantId: string;before: number;}[] = [];
  for (const line of expandToStockLines(order.items, variantsById, productsById)) {
    const before = availableQty(getBalance(store.balances, line.variantId, order.warehouseId));
    store = applyMovement(store, {
      variantId: line.variantId,
      productId: line.productId,
      warehouseId: order.warehouseId,
      change: -line.quantity,
      reservedDelta: reserved ? -line.quantity : 0,
      type: 'sale',
      reference: { kind: 'order', id: order.id, label: order.number },
      userId: ctx.user.id,
      reason: 'Order fulfilled',
      at,
      label: productsById.get(line.productId)?.name
    }).store;
    touched.push({ variantId: line.variantId, before: reserved ? before + line.quantity : before });
  }
  let next = withStockStore(state, store);
  for (const t of touched) next = checkLowStock(next, t.variantId, order.warehouseId, t.before, ctx.now);
  const warehouse = state.warehouses.find((w) => w.id === order.warehouseId);
  const units = order.items.reduce((s, i) => s + i.quantity, 0);
  const updated: Order = {
    ...order,
    status: 'fulfilled',
    fulfilledAt: at,
    timeline: [...order.timeline, timelineEvent('fulfilled', `Fulfilled from ${warehouse?.name}`, ctx.user.id, at, { Units: String(units) })]
  };
  next = replaceOrder(next, updated);
  next = withAudit(next, ctx, {
    action: 'order.fulfilled',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [{ field: 'status', from: order.status, to: 'fulfilled' }]
  });
  return { state: next, result: updated };
}

export function cancelOrder(state: ErpState, input: {orderId: string;reason: string;}, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.cancel');
  const order = getOrder(state, input.orderId, ctx);
  if (['fulfilled', 'returned'].includes(order.status)) {
    throw new DomainError('INVALID_STATE', "Fulfilled orders can't be cancelled. Issue a refund instead.");
  }
  if (['cancelled', 'refunded'].includes(order.status)) throw new DomainError('INVALID_STATE', `${order.number} is already closed.`);
  const totals = orderTotals(order, state.company.taxRateBps);
  if (totals.netPaid > 0) {
    throw new DomainError('INVALID_STATE', `Refund the ${formatMoney(totals.netPaid)} already paid before cancelling.`);
  }
  let next = isReservedStatus(order.status) ? reserveForOrder(state, order, -1) : state;
  const at = ctx.now.toISOString();
  const updated: Order = {
    ...order,
    status: 'cancelled',
    timeline: [...order.timeline, timelineEvent('cancelled', `Order cancelled — ${input.reason}`, ctx.user.id, at)]
  };
  next = replaceOrder(next, updated);
  next = withAudit(next, ctx, {
    action: 'order.cancelled',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [{ field: 'status', from: order.status, to: 'cancelled' }]
  });
  return { state: next, result: updated };
}

export interface RefundInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reason: string;
  restock: boolean;
}

export function refundOrder(state: ErpState, input: RefundInput, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.refund');
  const order = getOrder(state, input.orderId, ctx);
  const totals = orderTotals(order, state.company.taxRateBps);
  if (input.amount <= 0) throw new DomainError('VALIDATION', 'Enter a refund amount greater than zero.');
  if (input.amount > totals.netPaid) {
    throw new DomainError('LIMIT_EXCEEDED', `You can't refund more than the ${formatMoney(totals.netPaid, { decimals: true })} paid.`);
  }
  const full = input.amount === totals.netPaid;
  if (input.restock && (!full || order.status !== 'fulfilled')) {
    throw new DomainError('VALIDATION', 'Restocking is only available when fully refunding a fulfilled order.');
  }
  const at = ctx.now.toISOString();
  let next = state;
  let status = order.status;
  const events = [
  timelineEvent('refund', `Refund of ${formatMoney(input.amount, { decimals: true })} issued — ${input.reason}`, ctx.user.id, at, { Method: methodLabels[input.method] })];

  if (full) {
    if (order.status === 'fulfilled' && input.restock) {
      const { variantsById, productsById } = mapsOf(state);
      let store = stockStoreOf(next);
      for (const line of expandToStockLines(order.items, variantsById, productsById)) {
        store = applyMovement(store, {
          variantId: line.variantId,
          productId: line.productId,
          warehouseId: order.warehouseId,
          change: line.quantity,
          type: 'return',
          reference: { kind: 'order', id: order.id, label: order.number },
          userId: ctx.user.id,
          reason: input.reason,
          at
        }).store;
      }
      next = withStockStore(next, store);
      status = 'returned';
      events.push(timelineEvent('returned', 'Items returned and restocked', ctx.user.id, at));
    } else if (order.status !== 'fulfilled') {
      if (isReservedStatus(order.status)) next = reserveForOrder(next, order, -1);
      status = 'refunded';
    } else {
      status = 'refunded';
    }
  }
  const payments = [
  ...order.payments,
  { id: createId('rfd'), kind: 'refund' as const, amount: input.amount, method: input.method, reference: input.reason, createdAt: at, userId: ctx.user.id }];

  const paymentStatus = derivePaymentStatus(totals.total, totals.paid, totals.refunded + input.amount);
  const updated: Order = { ...order, status, payments, paymentStatus, timeline: [...order.timeline, ...events] };
  next = replaceOrder(next, updated);
  if (input.amount >= 10_000_000) {
    next = withNotification(next, ctx.now, {
      kind: 'refund',
      title: 'Large refund issued',
      body: `${formatMoney(input.amount)} on ${order.number} by ${ctx.user.name}`,
      href: `/orders/${order.id}`
    });
  }
  next = withAudit(next, ctx, {
    action: 'order.refunded',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [
    { field: 'refund amount', from: '—', to: formatMoney(input.amount, { decimals: true }) },
    { field: 'payment status', from: order.paymentStatus, to: paymentStatus }]

  });
  return { state: next, result: updated };
}

export function addOrderNote(state: ErpState, input: {orderId: string;body: string;}, ctx: DomainContext): DomainResult<Order> {
  const order = getOrder(state, input.orderId, ctx);
  const body = input.body.trim();
  if (!body) throw new DomainError('VALIDATION', 'Write something before posting.');
  const mentioned = state.users.filter((u) => u.kind === 'person' && body.includes(`@${u.name.split(' ')[0]}`));
  const at = ctx.now.toISOString();
  const updated: Order = {
    ...order,
    timeline: [...order.timeline, timelineEvent('note', body, ctx.user.id, at, mentioned.length ? { Mentions: mentioned.map((u) => u.name).join(', ') } : undefined)]
  };
  let next = replaceOrder(state, updated);
  for (const user of mentioned) {
    if (user.id === ctx.user.id) continue;
    next = withNotification(next, ctx.now, {
      kind: 'mention',
      title: `${ctx.user.name.split(' ')[0]} mentioned ${user.name.split(' ')[0]}`,
      body: `On ${order.number}: “${body.length > 70 ? `${body.slice(0, 70)}…` : body}”`,
      href: `/orders/${order.id}`
    });
  }
  return { state: next, result: updated };
}

export function assignOrder(state: ErpState, input: {orderId: string;userId: string;}, ctx: DomainContext): DomainResult<Order> {
  assertCan(ctx, 'orders.update');
  const order = getOrder(state, input.orderId, ctx);
  const assignee = state.users.find((u) => u.id === input.userId);
  if (!assignee) throw new DomainError('VALIDATION', 'Choose a staff member.');
  if (order.assignedTo === assignee.id) return { state, result: order };
  const at = ctx.now.toISOString();
  const updated: Order = {
    ...order,
    assignedTo: assignee.id,
    timeline: [...order.timeline, timelineEvent('assigned', `Assigned to ${assignee.name}`, ctx.user.id, at)]
  };
  let next = replaceOrder(state, updated);
  const previous = state.users.find((u) => u.id === order.assignedTo);
  next = withAudit(next, ctx, {
    action: 'order.assigned',
    resource: 'Order',
    resourceId: order.id,
    resourceLabel: order.number,
    changes: [{ field: 'assigned to', from: previous?.name ?? '—', to: assignee.name }]
  });
  return { state: next, result: updated };
}

export function duplicateOrder(state: ErpState, orderId: string, ctx: DomainContext): DomainResult<Order> {
  const order = getOrder(state, orderId, ctx);
  const result = createOrder(
    state,
    {
      customerId: order.customerId,
      branchId: ctx.role.scope === 'BRANCH' && ctx.user.branchId ? ctx.user.branchId : order.branchId,
      channel: order.channel,
      lines: order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      orderDiscount: 0,
      customerNote: '',
      confirm: false
    },
    ctx
  );
  const withNote: Order = {
    ...result.result,
    timeline: [...result.result.timeline, timelineEvent('note', `Duplicated from ${order.number}`, ctx.user.id, ctx.now.toISOString())]
  };
  return { state: replaceOrder(result.state, withNote), result: withNote };
}