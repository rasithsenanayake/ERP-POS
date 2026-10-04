import type { Transfer, TransferStatus } from '../../types/inventory';
import { DAY, HOUR } from '../dates';
import { sequenceLabel } from '../ids';
import { changeIncoming } from '../inventory';
import { randInt } from '../random';
import { iso, SeedContext, SeedEvent, seedMove, variantBySku } from './context';
import { DEMO_IP } from '../domain/helpers';

const STORE_WAREHOUSES = ['wh-col', 'wh-kdy', 'wh-gal'];

const openingRange: Record<string, [number, number]> = {
  Phones: [6, 12],
  Laptops: [3, 7],
  Audio: [8, 18],
  'Smart Home': [6, 16],
  Accessories: [18, 45]
};

/** Deliberately thin starting stock so low-stock alerts and runout insights have something real to find. */
const lowOverrides: Record<string, number> = {
  'GA55-128-NVY@wh-gal': 3,
  'APP2-USBC@wh-col': 9,
  'FLIP6-BLU@wh-kdy': 2,
  'IPH15-128-BLK@wh-gal': 2,
  'LOGI-K380-ROSE@wh-col': 3,
  'TAPO-C210@wh-kdy': 6
};

export function addOpeningEvents(events: SeedEvent[], ctx: SeedContext): void {
  const at = ctx.now.getTime() - 100 * DAY;
  events.push({
    at,
    run: () => {
      for (const variant of ctx.variants) {
        const product = ctx.productsById.get(variant.productId)!;
        if (product.type !== 'physical' || product.status !== 'active') continue;
        const [min, max] = openingRange[product.category] ?? [5, 10];
        const slow = ctx.slowProductIds.has(product.id);
        const locations = slow ? ['wh-col', 'wh-kel'] : [...STORE_WAREHOUSES, 'wh-kel'];
        for (const warehouseId of locations) {
          const override = lowOverrides[`${variant.sku}@${warehouseId}`];
          const base = slow ? randInt(ctx.rng, 4, 8) : randInt(ctx.rng, min, max);
          const quantity = override ?? (warehouseId === 'wh-kel' ? base * 3 : base);
          seedMove(ctx, {
            variantId: variant.id,
            productId: product.id,
            warehouseId,
            change: quantity,
            type: 'opening',
            reference: { kind: 'opening', id: 'opening', label: 'Opening balance' },
            userId: 'u-ishara',
            reason: 'Opening stock take',
            at: iso(at)
          });
        }
      }
    }
  });
}

export function addReceiptEvents(events: SeedEvent[], ctx: SeedContext): void {
  const at = ctx.now.getTime() - 40 * DAY + 10 * HOUR;
  events.push({
    at,
    run: () => {
      for (const variant of ctx.variants) {
        const product = ctx.productsById.get(variant.productId)!;
        if (product.type !== 'physical' || !['Phones', 'Laptops'].includes(product.category) || product.status !== 'active') continue;
        seedMove(ctx, {
          variantId: variant.id,
          productId: product.id,
          warehouseId: 'wh-kel',
          change: 8,
          type: 'receive',
          reference: { kind: 'receipt', id: 'grn-41', label: 'GRN-000041' },
          userId: 'u-ishara',
          reason: `Supplier delivery — ${product.supplier}`,
          at: iso(at)
        });
      }
    }
  });
}

interface AdjustmentSeed {
  daysAgo: number;
  sku: string;
  warehouseId: string;
  change: number;
  type: 'write_off' | 'adjustment' | 'receive';
  reason: string;
  userId: string;
}

const adjustmentSeeds: AdjustmentSeed[] = [
{ daysAgo: 18, sku: 'FLIP6-RED', warehouseId: 'wh-gal', change: -1, type: 'write_off', reason: 'Damaged — water exposure in display unit', userId: 'u-sachini' },
{ daysAgo: 9, sku: 'SPG-IP15-CLR', warehouseId: 'wh-col', change: -2, type: 'adjustment', reason: 'Cycle count variance', userId: 'u-nimali' },
{ daysAgo: 4, sku: 'SE-GLASS-UNI', warehouseId: 'wh-kdy', change: 30, type: 'receive', reason: 'Local supplier top-up', userId: 'u-kasun' }];


export function addAdjustmentEvents(events: SeedEvent[], ctx: SeedContext): void {
  for (const seed of adjustmentSeeds) {
    const at = ctx.now.getTime() - seed.daysAgo * DAY + 11 * HOUR;
    events.push({
      at,
      run: () => {
        const variant = variantBySku(ctx, seed.sku);
        ctx.counters.adjustment += 1;
        const label = sequenceLabel('ADJ', ctx.counters.adjustment);
        const before = ctx.store.balances[`${variant.id}@${seed.warehouseId}`]?.onHand ?? 0;
        const ok = seedMove(ctx, {
          variantId: variant.id,
          productId: variant.productId,
          warehouseId: seed.warehouseId,
          change: seed.change,
          type: seed.type,
          reference: { kind: 'adjustment', id: label, label },
          userId: seed.userId,
          reason: seed.reason,
          at: iso(at)
        });
        if (ok) {
          ctx.audit.push({
            id: `aud-${label}`,
            userId: seed.userId,
            action: 'inventory.adjusted',
            resource: 'Stock',
            resourceId: variant.id,
            resourceLabel: `${variant.sku} @ ${seed.warehouseId.replace('wh-', '').toUpperCase()}`,
            createdAt: iso(at),
            ip: DEMO_IP,
            changes: [{ field: 'on hand', from: String(before), to: String(before + seed.change) }]
          });
        }
      }
    });
  }
}

interface TransferSeed {
  daysAgo: number;
  hoursAgo?: number;
  from: string;
  to: string;
  status: TransferStatus;
  createdBy: string;
  lines: {sku: string;quantity: number;}[];
  note: string;
}

const transferSeeds: TransferSeed[] = [
{ daysAgo: 30, from: 'wh-kel', to: 'wh-col', status: 'received', createdBy: 'u-ishara', lines: [{ sku: 'IPH15-128-BLK', quantity: 4 }, { sku: 'APP2-USBC', quantity: 6 }], note: 'Weekly replenishment' },
{ daysAgo: 20, from: 'wh-kel', to: 'wh-kdy', status: 'received', createdBy: 'u-kasun', lines: [{ sku: 'GS24-256-BLK', quantity: 3 }, { sku: 'JBLT520-BLK', quantity: 10 }], note: 'Avurudu promotion stock' },
{ daysAgo: 10, from: 'wh-kel', to: 'wh-col', status: 'cancelled', createdBy: 'u-nimali', lines: [{ sku: 'DECO-X20-2P', quantity: 4 }], note: 'Raised in error' },
{ daysAgo: 1, from: 'wh-kel', to: 'wh-gal', status: 'in_transit', createdBy: 'u-sachini', lines: [{ sku: 'GA55-128-NVY', quantity: 6 }, { sku: 'IPH15-128-BLK', quantity: 3 }], note: 'Galle running low on phones' },
{ daysAgo: 1, from: 'wh-col', to: 'wh-gal', status: 'approved', createdBy: 'u-sachini', lines: [{ sku: 'LOGI-K380-GRA', quantity: 4 }], note: 'Corporate order at Fort Bay' },
{ daysAgo: 0, hoursAgo: 3, from: 'wh-kel', to: 'wh-kdy', status: 'requested', createdBy: 'u-kasun', lines: [{ sku: 'FLIP6-BLU', quantity: 6 }, { sku: 'ECHO5-CHR', quantity: 4 }], note: 'Restock before the weekend' },
{ daysAgo: 0, hoursAgo: 1, from: 'wh-kdy', to: 'wh-col', status: 'draft', createdBy: 'u-kasun', lines: [{ sku: 'TAPO-C210', quantity: 2 }], note: '' }];


const statusOrder: TransferStatus[] = ['draft', 'requested', 'approved', 'in_transit', 'received'];

export function addTransferEvents(events: SeedEvent[], ctx: SeedContext): void {
  transferSeeds.forEach((seed, index) => {
    const createdAt = ctx.now.getTime() - seed.daysAgo * DAY - (seed.hoursAgo ?? (seed.daysAgo > 0 ? 0 : 1)) * HOUR - (seed.daysAgo > 0 ? 6 * HOUR : 0);
    const number = sequenceLabel('TRF', 101 + index);
    const id = `trf-seed-${index + 1}`;
    const approver = seed.createdBy === 'u-nimali' ? 'u-kasun' : 'u-nimali';
    const reached = seed.status === 'cancelled' ? 2 : statusOrder.indexOf(seed.status);
    const history = statusOrder.slice(0, reached + 1).map((status, i) => ({
      status,
      at: iso(createdAt + i * 2 * HOUR),
      userId: status === 'approved' ? approver : status === 'in_transit' || status === 'received' ? 'u-ishara' : seed.createdBy
    }));
    if (seed.status === 'cancelled') history.push({ status: 'cancelled', at: iso(createdAt + 5 * HOUR), userId: seed.createdBy });
    const lines = seed.lines.map((l) => ({ variantId: variantBySku(ctx, l.sku).id, quantity: l.quantity }));
    const transfer: Transfer = {
      id,
      number,
      fromWarehouseId: seed.from,
      toWarehouseId: seed.to,
      status: seed.status,
      lines,
      note: seed.note,
      createdBy: seed.createdBy,
      createdAt: iso(createdAt),
      history
    };
    ctx.transfers.push(transfer);
    ctx.counters.transfer = Math.max(ctx.counters.transfer, 101 + index);
    if (seed.status === 'in_transit' || seed.status === 'received') {
      const dispatchAt = createdAt + 6 * HOUR;
      events.push({
        at: dispatchAt,
        run: () => {
          for (const line of lines) {
            const variant = ctx.variantsById.get(line.variantId)!;
            seedMove(ctx, {
              variantId: line.variantId,
              productId: variant.productId,
              warehouseId: seed.from,
              change: -line.quantity,
              type: 'transfer_out',
              reference: { kind: 'transfer', id, label: number },
              userId: 'u-ishara',
              reason: 'Dispatched for transfer',
              at: iso(dispatchAt)
            });
            ctx.store = { ...ctx.store, balances: changeIncoming(ctx.store.balances, line.variantId, seed.to, line.quantity) };
          }
        }
      });
    }
    if (seed.status === 'received') {
      const receiveAt = createdAt + 8 * HOUR;
      events.push({
        at: receiveAt,
        run: () => {
          for (const line of lines) {
            const variant = ctx.variantsById.get(line.variantId)!;
            seedMove(ctx, {
              variantId: line.variantId,
              productId: variant.productId,
              warehouseId: seed.to,
              change: line.quantity,
              incomingDelta: -line.quantity,
              type: 'transfer_in',
              reference: { kind: 'transfer', id, label: number },
              userId: 'u-ishara',
              reason: 'Received from transfer',
              at: iso(receiveAt)
            });
          }
        }
      });
    }
  });
}