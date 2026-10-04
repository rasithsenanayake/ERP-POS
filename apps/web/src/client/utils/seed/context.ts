import type { Product, Variant } from '../../types/catalog';
import type { Transfer } from '../../types/inventory';
import type { Customer, Order } from '../../types/sales';
import type { AuditEntry } from '../../types/system';
import { applyMovement, availableQty, changeReservation, getBalance, MovementInput, StockLine, StockStore } from '../inventory';
import type { Rng } from '../random';

export interface SeedEvent {
  at: number;
  run: () => void;
}

export interface SeedContext {
  now: Date;
  rng: Rng;
  products: Product[];
  variants: Variant[];
  productsById: Map<string, Product>;
  variantsById: Map<string, Variant>;
  slowProductIds: Set<string>;
  demandByProduct: Map<string, number>;
  customers: Customer[];
  store: StockStore;
  orders: Order[];
  transfers: Transfer[];
  audit: AuditEntry[];
  counters: {order: number;adjustment: number;transfer: number;};
}

export function seedMove(ctx: SeedContext, input: MovementInput): boolean {
  try {
    ctx.store = applyMovement(ctx.store, input).store;
    return true;
  } catch {
    return false;
  }
}

export function seedReserve(ctx: SeedContext, lines: StockLine[], warehouseId: string): void {
  let balances = ctx.store.balances;
  for (const line of lines) balances = changeReservation(balances, line.variantId, warehouseId, line.quantity);
  ctx.store = { ...ctx.store, balances };
}

export function canSupply(ctx: SeedContext, lines: StockLine[], warehouseId: string): boolean {
  return lines.every((line) => availableQty(getBalance(ctx.store.balances, line.variantId, warehouseId)) >= line.quantity);
}

export function variantBySku(ctx: SeedContext, sku: string): Variant {
  const variant = ctx.variants.find((v) => v.sku === sku);
  if (!variant) throw new Error(`Seed SKU not found: ${sku}`);
  return variant;
}

export function iso(ms: number): string {
  return new Date(ms).toISOString();
}