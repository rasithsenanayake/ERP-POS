import { useMemo } from 'react';
import { useErp } from '../contexts/ErpContext';
import type { Product, Variant } from '../types/catalog';
import { availableQty, bundleAvailable, getBalance } from '../utils/inventory';

export interface ProductRow {
  product: Product;
  variants: Variant[];
  available: number | null;
  minPrice: number;
  maxPrice: number;
  minCost: number;
  marginPct: number | null;
  lowStock: boolean;
}

/** Catalog rows with availability scoped to the locations the user is viewing. */
export function useProductRows(): ProductRow[] {
  const { state, scoped } = useErp();
  return useMemo(() => {
    const warehouseIds = scoped.warehouses.map((w) => w.id);
    const byProduct = new Map<string, Variant[]>();
    for (const v of state.variants) byProduct.set(v.productId, [...(byProduct.get(v.productId) ?? []), v]);
    return state.products.map((product) => {
      const variants = byProduct.get(product.id) ?? [];
      let available: number | null = null;
      let lowStock = false;
      if (product.type === 'physical') {
        available = 0;
        for (const v of variants) {
          for (const w of scoped.warehouses) {
            const a = availableQty(getBalance(state.balances, v.id, w.id));
            available += a;
            const threshold = w.kind === 'central' ? product.reorderPoint * 3 : product.reorderPoint;
            if (product.status === 'active' && product.reorderPoint > 0 && a <= threshold && state.balances[`${v.id}@${w.id}`]) lowStock = true;
          }
        }
      } else if (product.type === 'bundle') {
        available = bundleAvailable(product, state.balances, warehouseIds);
      }
      const prices = variants.map((v) => v.price);
      const costs = variants.map((v) => v.cost);
      const minPrice = Math.min(...prices);
      const minCost = Math.min(...costs);
      const avgPrice = prices.reduce((s, p) => s + p, 0) / (prices.length || 1);
      const avgCost = costs.reduce((s, p) => s + p, 0) / (costs.length || 1);
      return {
        product,
        variants,
        available,
        minPrice,
        maxPrice: Math.max(...prices),
        minCost,
        marginPct: product.type === 'service' || avgPrice <= 0 ? null : (avgPrice - avgCost) / avgPrice * 100,
        lowStock
      };
    });
  }, [state.products, state.variants, state.balances, scoped.warehouses]);
}