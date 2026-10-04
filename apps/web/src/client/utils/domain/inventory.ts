import type { ErpState } from '../../types/erp';
import type { AdjustmentKind, LedgerEntry, Transfer, TransferLine, TransferStatus } from '../../types/inventory';
import { DomainError } from '../errors';
import { createId, sequenceLabel } from '../ids';
import { applyMovement, availableQty, changeIncoming, getBalance } from '../inventory';
import {
  assertCan,
  checkLowStock,
  DomainContext,
  DomainResult,
  mapsOf,
  stockStoreOf,
  withAudit,
  withNotification,
  withStockStore } from
'./helpers';

export interface AdjustmentInput {
  variantId: string;
  warehouseId: string;
  kind: AdjustmentKind;
  /** Units for receive/issue/write-off; the counted quantity for a count adjustment. */
  quantity: number;
  reason: string;
  note: string;
}

export const adjustmentKindLabels: Record<AdjustmentKind, string> = {
  receive: 'Receive',
  issue: 'Issue',
  adjustment: 'Count',
  write_off: 'Write-off'
};

export function adjustStock(state: ErpState, input: AdjustmentInput, ctx: DomainContext): DomainResult<LedgerEntry> {
  assertCan(ctx, 'inventory.adjust');
  const { variantsById, productsById } = mapsOf(state);
  const variant = variantsById.get(input.variantId);
  const product = variant ? productsById.get(variant.productId) : undefined;
  if (!variant || !product) throw new DomainError('VALIDATION', 'Choose a product to adjust.');
  if (product.type !== 'physical') throw new DomainError('VALIDATION', `${product.name} isn't stocked directly — adjust its components instead.`);
  const warehouse = state.warehouses.find((w) => w.id === input.warehouseId);
  if (!warehouse) throw new DomainError('VALIDATION', 'Choose a location.');
  if (ctx.role.scope === 'BRANCH' && warehouse.branchId !== ctx.user.branchId) {
    throw new DomainError('FORBIDDEN', 'You can only adjust stock at your own branch.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 0) throw new DomainError('VALIDATION', 'Quantity must be a whole number.');
  if (!input.reason.trim()) throw new DomainError('VALIDATION', 'A reason is required for every stock adjustment.');
  const current = getBalance(state.balances, variant.id, warehouse.id);
  const change =
  input.kind === 'receive' ? input.quantity : input.kind === 'adjustment' ? input.quantity - current.onHand : -input.quantity;
  if (change === 0) {
    throw new DomainError('VALIDATION', input.kind === 'adjustment' ? 'Counted quantity matches on-hand stock — nothing to adjust.' : 'Enter a quantity greater than zero.');
  }
  if (current.onHand + change < current.reserved) {
    throw new DomainError('INSUFFICIENT_STOCK', `This would leave fewer units than the ${current.reserved} reserved for open orders.`);
  }
  const seq = state.sequences.adjustment + 1;
  const label = sequenceLabel('ADJ', seq);
  const availableBefore = availableQty(current);
  const reason = input.note.trim() ? `${input.reason} — ${input.note.trim()}` : input.reason;
  const { store, entry } = applyMovement(stockStoreOf(state), {
    variantId: variant.id,
    productId: product.id,
    warehouseId: warehouse.id,
    change,
    type: input.kind,
    reference: { kind: 'adjustment', id: label, label },
    userId: ctx.user.id,
    reason,
    at: ctx.now.toISOString(),
    label: product.name
  });
  let next = withStockStore(state, store);
  next = { ...next, sequences: { ...next.sequences, adjustment: seq } };
  next = checkLowStock(next, variant.id, warehouse.id, availableBefore, ctx.now);
  next = withAudit(next, ctx, {
    action: 'inventory.adjusted',
    resource: 'Stock',
    resourceId: variant.id,
    resourceLabel: `${variant.sku} @ ${warehouse.code}`,
    changes: [{ field: 'on hand', from: String(entry.before), to: String(entry.after) }]
  });
  return { state: next, result: entry };
}

export interface TransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: TransferLine[];
  note: string;
  submit: boolean;
}

export const transferNextStatus: Partial<Record<TransferStatus, TransferStatus>> = {
  draft: 'requested',
  requested: 'approved',
  approved: 'in_transit',
  in_transit: 'received'
};

export const transferActionLabels: Partial<Record<TransferStatus, string>> = {
  draft: 'Submit request',
  requested: 'Approve',
  approved: 'Mark dispatched',
  in_transit: 'Receive stock'
};

function assertTransferScope(state: ErpState, transfer: Pick<Transfer, 'fromWarehouseId' | 'toWarehouseId'>, ctx: DomainContext) {
  if (ctx.role.scope !== 'BRANCH') return;
  const touches = [transfer.fromWarehouseId, transfer.toWarehouseId].some(
    (id) => state.warehouses.find((w) => w.id === id)?.branchId === ctx.user.branchId
  );
  if (!touches) throw new DomainError('FORBIDDEN', 'This transfer does not involve your branch.');
}

export function createTransfer(state: ErpState, input: TransferInput, ctx: DomainContext): DomainResult<Transfer> {
  assertCan(ctx, 'inventory.transfer');
  if (!input.fromWarehouseId || !input.toWarehouseId) throw new DomainError('VALIDATION', 'Choose both locations.');
  if (input.fromWarehouseId === input.toWarehouseId) throw new DomainError('VALIDATION', 'Source and destination must be different.');
  const lines = input.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) throw new DomainError('VALIDATION', 'Add at least one product to transfer.');
  assertTransferScope(state, input, ctx);
  const { variantsById, productsById } = mapsOf(state);
  for (const line of lines) {
    const variant = variantsById.get(line.variantId);
    const product = variant ? productsById.get(variant.productId) : undefined;
    const available = availableQty(getBalance(state.balances, line.variantId, input.fromWarehouseId));
    if (line.quantity > available) {
      throw new DomainError('INSUFFICIENT_STOCK', `Only ${available} of ${product?.name ?? 'this product'} available at the source.`);
    }
  }
  const seq = state.sequences.transfer + 1;
  const at = ctx.now.toISOString();
  const status: TransferStatus = input.submit ? 'requested' : 'draft';
  const transfer: Transfer = {
    id: createId('trf'),
    number: sequenceLabel('TRF', seq),
    fromWarehouseId: input.fromWarehouseId,
    toWarehouseId: input.toWarehouseId,
    status,
    lines,
    note: input.note.trim(),
    createdBy: ctx.user.id,
    createdAt: at,
    history: input.submit ?
    [{ status: 'draft', at, userId: ctx.user.id }, { status: 'requested', at, userId: ctx.user.id }] :
    [{ status: 'draft', at, userId: ctx.user.id }]
  };
  let next: ErpState = { ...state, transfers: [transfer, ...state.transfers], sequences: { ...state.sequences, transfer: seq } };
  if (input.submit) {
    next = withNotification(next, ctx.now, {
      kind: 'transfer',
      title: `${transfer.number} awaiting approval`,
      body: `${lines.reduce((s, l) => s + l.quantity, 0)} units requested by ${ctx.user.name}`,
      href: '/inventory/transfers'
    });
  }
  next = withAudit(next, ctx, { action: 'transfer.created', resource: 'Transfer', resourceId: transfer.id, resourceLabel: transfer.number, changes: [] });
  return { state: next, result: transfer };
}

export function advanceTransfer(state: ErpState, transferId: string, ctx: DomainContext): DomainResult<Transfer> {
  assertCan(ctx, 'inventory.transfer');
  const transfer = state.transfers.find((t) => t.id === transferId);
  if (!transfer) throw new DomainError('NOT_FOUND', 'This transfer no longer exists.');
  assertTransferScope(state, transfer, ctx);
  const nextStatus = transferNextStatus[transfer.status];
  if (!nextStatus) throw new DomainError('INVALID_STATE', `${transfer.number} is ${transfer.status.replace('_', ' ')} and can't move forward.`);
  if (nextStatus === 'approved' && transfer.createdBy === ctx.user.id && ctx.role.key !== 'owner') {
    throw new DomainError('FORBIDDEN', "Company policy doesn't allow approving a transfer you requested.");
  }
  const at = ctx.now.toISOString();
  const { variantsById } = mapsOf(state);
  let next = state;
  if (nextStatus === 'in_transit') {
    let store = stockStoreOf(next);
    const touched: {variantId: string;before: number;}[] = [];
    for (const line of transfer.lines) {
      const variant = variantsById.get(line.variantId)!;
      touched.push({ variantId: line.variantId, before: availableQty(getBalance(store.balances, line.variantId, transfer.fromWarehouseId)) });
      store = applyMovement(store, {
        variantId: line.variantId,
        productId: variant.productId,
        warehouseId: transfer.fromWarehouseId,
        change: -line.quantity,
        type: 'transfer_out',
        reference: { kind: 'transfer', id: transfer.id, label: transfer.number },
        userId: ctx.user.id,
        reason: 'Dispatched for transfer',
        at,
        label: variant.sku
      }).store;
      store = { ...store, balances: changeIncoming(store.balances, line.variantId, transfer.toWarehouseId, line.quantity) };
    }
    next = withStockStore(next, store);
    for (const t of touched) next = checkLowStock(next, t.variantId, transfer.fromWarehouseId, t.before, ctx.now);
  }
  if (nextStatus === 'received') {
    let store = stockStoreOf(next);
    for (const line of transfer.lines) {
      const variant = variantsById.get(line.variantId)!;
      store = applyMovement(store, {
        variantId: line.variantId,
        productId: variant.productId,
        warehouseId: transfer.toWarehouseId,
        change: line.quantity,
        incomingDelta: -line.quantity,
        type: 'transfer_in',
        reference: { kind: 'transfer', id: transfer.id, label: transfer.number },
        userId: ctx.user.id,
        reason: 'Received from transfer',
        at
      }).store;
    }
    next = withStockStore(next, store);
  }
  const updated: Transfer = { ...transfer, status: nextStatus, history: [...transfer.history, { status: nextStatus, at, userId: ctx.user.id }] };
  next = { ...next, transfers: next.transfers.map((t) => t.id === transfer.id ? updated : t) };
  if (nextStatus === 'requested') {
    next = withNotification(next, ctx.now, { kind: 'transfer', title: `${transfer.number} awaiting approval`, body: `Submitted by ${ctx.user.name}`, href: '/inventory/transfers' });
  }
  next = withAudit(next, ctx, {
    action: `transfer.${nextStatus}`,
    resource: 'Transfer',
    resourceId: transfer.id,
    resourceLabel: transfer.number,
    changes: [{ field: 'status', from: transfer.status, to: nextStatus }]
  });
  return { state: next, result: updated };
}

export function cancelTransfer(state: ErpState, transferId: string, ctx: DomainContext): DomainResult<Transfer> {
  assertCan(ctx, 'inventory.transfer');
  const transfer = state.transfers.find((t) => t.id === transferId);
  if (!transfer) throw new DomainError('NOT_FOUND', 'This transfer no longer exists.');
  assertTransferScope(state, transfer, ctx);
  if (!['draft', 'requested', 'approved'].includes(transfer.status)) {
    throw new DomainError('INVALID_STATE', 'Transfers can only be cancelled before they are dispatched.');
  }
  const at = ctx.now.toISOString();
  const updated: Transfer = { ...transfer, status: 'cancelled', history: [...transfer.history, { status: 'cancelled', at, userId: ctx.user.id }] };
  let next: ErpState = { ...state, transfers: state.transfers.map((t) => t.id === transfer.id ? updated : t) };
  next = withAudit(next, ctx, {
    action: 'transfer.cancelled',
    resource: 'Transfer',
    resourceId: transfer.id,
    resourceLabel: transfer.number,
    changes: [{ field: 'status', from: transfer.status, to: 'cancelled' }]
  });
  return { state: next, result: updated };
}