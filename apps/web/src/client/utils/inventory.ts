import type { Product, Variant } from '../types/catalog';
import type { LedgerEntry, LedgerReference, MovementType, StockBalance } from '../types/inventory';
import { DomainError } from './errors';
import { createId } from './ids';

export type Balances = Record<string, StockBalance>;

export interface StockStore {
  balances: Balances;
  ledger: LedgerEntry[];
  seq: number;
}

export interface MovementInput {
  variantId: string;
  productId: string;
  warehouseId: string;
  change: number;
  type: MovementType;
  reference: LedgerReference;
  userId: string;
  reason: string;
  at: string;
  label?: string;
  reservedDelta?: number;
  incomingDelta?: number;
}

export interface StockLine {
  variantId: string;
  productId: string;
  quantity: number;
}

export function balanceKey(variantId: string, warehouseId: string): string {
  return `${variantId}@${warehouseId}`;
}

export function getBalance(balances: Balances, variantId: string, warehouseId: string): StockBalance {
  return balances[balanceKey(variantId, warehouseId)] ?? { variantId, warehouseId, onHand: 0, reserved: 0, incoming: 0, damaged: 0 };
}

export function availableQty(balance: StockBalance): number {
  return Math.max(0, balance.onHand - balance.reserved);
}

/**
 * The only way stock on hand can change. Every call appends an immutable ledger
 * entry recording before / change / after, the reference document and who did it.
 */
export function applyMovement(store: StockStore, input: MovementInput): {store: StockStore;entry: LedgerEntry;} {
  const current = getBalance(store.balances, input.variantId, input.warehouseId);
  const after = current.onHand + input.change;
  if (after < 0) {
    throw new DomainError(
      'INSUFFICIENT_STOCK',
      `Not enough stock${input.label ? ` of ${input.label}` : ''}. ${current.onHand} on hand, ${Math.abs(input.change)} needed.`
    );
  }
  const next: StockBalance = {
    ...current,
    onHand: after,
    reserved: Math.max(0, current.reserved + (input.reservedDelta ?? 0)),
    incoming: Math.max(0, current.incoming + (input.incomingDelta ?? 0))
  };
  const seq = store.seq + 1;
  const entry: LedgerEntry = {
    id: createId('stk'),
    seq,
    variantId: input.variantId,
    productId: input.productId,
    warehouseId: input.warehouseId,
    type: input.type,
    before: current.onHand,
    change: input.change,
    after,
    reference: input.reference,
    userId: input.userId,
    reason: input.reason,
    createdAt: input.at
  };
  return {
    store: { balances: { ...store.balances, [balanceKey(input.variantId, input.warehouseId)]: next }, ledger: [...store.ledger, entry], seq },
    entry
  };
}

/** Reservations hold stock for open orders. They are not stock movements, so they don't hit the ledger. */
export function changeReservation(balances: Balances, variantId: string, warehouseId: string, delta: number, label?: string): Balances {
  const current = getBalance(balances, variantId, warehouseId);
  if (delta > 0 && availableQty(current) < delta) {
    throw new DomainError('INSUFFICIENT_STOCK', `Only ${availableQty(current)} ${label ?? 'units'} available to reserve.`);
  }
  return { ...balances, [balanceKey(variantId, warehouseId)]: { ...current, reserved: Math.max(0, current.reserved + delta) } };
}

export function changeIncoming(balances: Balances, variantId: string, warehouseId: string, delta: number): Balances {
  const current = getBalance(balances, variantId, warehouseId);
  return { ...balances, [balanceKey(variantId, warehouseId)]: { ...current, incoming: Math.max(0, current.incoming + delta) } };
}

/** Expands order lines into physical stock lines: bundles become their components, services are skipped. */
export function expandToStockLines(
lines: {variantId: string;quantity: number;}[],
variantsById: Map<string, Variant>,
productsById: Map<string, Product>)
: StockLine[] {
  const merged = new Map<string, StockLine>();
  const add = (variantId: string, quantity: number) => {
    const variant = variantsById.get(variantId);
    if (!variant) return;
    const existing = merged.get(variantId);
    if (existing) existing.quantity += quantity;else
    merged.set(variantId, { variantId, productId: variant.productId, quantity });
  };
  for (const line of lines) {
    const variant = variantsById.get(line.variantId);
    if (!variant) continue;
    const product = productsById.get(variant.productId);
    if (!product || product.type === 'service') continue;
    if (product.type === 'bundle') {
      for (const component of product.bundle) add(component.variantId, component.quantity * line.quantity);
    } else {
      add(line.variantId, line.quantity);
    }
  }
  return Array.from(merged.values());
}

export interface AggregateStock {
  onHand: number;
  reserved: number;
  available: number;
  incoming: number;
  damaged: number;
}

export function aggregateStock(balances: Balances, variantId: string, warehouseIds: string[]): AggregateStock {
  const result: AggregateStock = { onHand: 0, reserved: 0, available: 0, incoming: 0, damaged: 0 };
  for (const warehouseId of warehouseIds) {
    const b = getBalance(balances, variantId, warehouseId);
    result.onHand += b.onHand;
    result.reserved += b.reserved;
    result.available += availableQty(b);
    result.incoming += b.incoming;
    result.damaged += b.damaged;
  }
  return result;
}

/** Kits that can be assembled per warehouse, limited by the scarcest component. */
export function bundleAvailable(product: Product, balances: Balances, warehouseIds: string[]): number {
  if (product.type !== 'bundle' || product.bundle.length === 0) return 0;
  let total = 0;
  for (const warehouseId of warehouseIds) {
    let kits = Infinity;
    for (const component of product.bundle) {
      const available = availableQty(getBalance(balances, component.variantId, warehouseId));
      kits = Math.min(kits, Math.floor(available / component.quantity));
    }
    total += Number.isFinite(kits) ? kits : 0;
  }
  return total;
}

export function variantAvailable(
variant: Variant,
product: Product,
balances: Balances,
warehouseIds: string[])
: number | null {
  if (product.type === 'service') return null;
  if (product.type === 'bundle') return bundleAvailable(product, balances, warehouseIds);
  return aggregateStock(balances, variant.id, warehouseIds).available;
}

export function suggestedReorder(available: number, reorderPoint: number, reorderQty: number): number {
  if (available > reorderPoint) return 0;
  return Math.max(reorderQty, reorderPoint * 2 - available);
}

export const movementLabels: Record<MovementType, string> = {
  opening: 'Opening balance',
  receive: 'Received',
  issue: 'Issued',
  adjustment: 'Count adjustment',
  write_off: 'Write-off',
  sale: 'Sale',
  return: 'Customer return',
  transfer_out: 'Transfer out',
  transfer_in: 'Transfer in'
};