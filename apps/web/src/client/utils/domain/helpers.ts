import type { ErpState } from '../../types/erp';
import type { Permission, Role, User } from '../../types/org';
import type { AppNotification, AuditEntry } from '../../types/system';
import type { TimelineEvent, TimelineEventType } from '../../types/sales';
import { DomainError } from '../errors';
import { createId } from '../ids';
import { availableQty, getBalance, StockStore } from '../inventory';

export interface DomainContext {
  user: User;
  role: Role;
  now: Date;
}

export interface DomainResult<T> {
  state: ErpState;
  result: T;
}

export const DEMO_IP = '203.94.68.12';

export function assertCan(ctx: DomainContext, permission: Permission, message?: string): void {
  if (!ctx.role.permissions.includes(permission)) {
    throw new DomainError('FORBIDDEN', message ?? `Your role (${ctx.role.name}) doesn't allow this action.`);
  }
}

export function withAudit(state: ErpState, ctx: DomainContext, entry: Omit<AuditEntry, 'id' | 'userId' | 'createdAt' | 'ip'>): ErpState {
  const audit: AuditEntry = { ...entry, id: createId('aud'), userId: ctx.user.id, createdAt: ctx.now.toISOString(), ip: DEMO_IP };
  return { ...state, audit: [audit, ...state.audit] };
}

export function withNotification(state: ErpState, now: Date, notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): ErpState {
  const item: AppNotification = { ...notification, id: createId('ntf'), createdAt: now.toISOString(), read: false };
  return { ...state, notifications: [item, ...state.notifications] };
}

export function timelineEvent(type: TimelineEventType, message: string, userId: string, at: string, meta?: Record<string, string>): TimelineEvent {
  return { id: createId('evt'), type, message, userId, createdAt: at, meta };
}

export function stockStoreOf(state: ErpState): StockStore {
  return { balances: state.balances, ledger: state.ledger, seq: state.sequences.ledger };
}

export function withStockStore(state: ErpState, store: StockStore): ErpState {
  return { ...state, balances: store.balances, ledger: store.ledger, sequences: { ...state.sequences, ledger: store.seq } };
}

/** Raises a low-stock alert the moment availability crosses the reorder point. */
export function checkLowStock(state: ErpState, variantId: string, warehouseId: string, availableBefore: number, now: Date): ErpState {
  const variant = state.variants.find((v) => v.id === variantId);
  if (!variant) return state;
  const product = state.products.find((p) => p.id === variant.productId);
  const warehouse = state.warehouses.find((w) => w.id === warehouseId);
  if (!product || !warehouse || product.reorderPoint <= 0) return state;
  const threshold = warehouse.kind === 'central' ? product.reorderPoint * 3 : product.reorderPoint;
  const after = availableQty(getBalance(state.balances, variantId, warehouseId));
  if (availableBefore > threshold && after <= threshold) {
    return withNotification(state, now, {
      kind: 'low_stock',
      title: `Low stock: ${product.name}${variant.title !== 'Default' ? ` · ${variant.title}` : ''}`,
      body: `${after} available at ${warehouse.name} · reorder point ${threshold}`,
      href: `/products/${product.id}`
    });
  }
  return state;
}

export function mapsOf(state: ErpState) {
  return {
    variantsById: new Map(state.variants.map((v) => [v.id, v])),
    productsById: new Map(state.products.map((p) => [p.id, p]))
  };
}