import type { Product, ProductSeed, Variant } from '../../types/catalog';
import { DAY } from '../dates';
import { rupeesToCents } from '../money';
import { randInt, Rng } from '../random';

function ean13(rng: Rng): string {
  const digits = [4, 7, 9];
  while (digits.length < 12) digits.push(Math.floor(rng() * 10));
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - sum % 10) % 10;
  return `${digits.join('')}${check}`;
}

export interface BuiltCatalog {
  products: Product[];
  variants: Variant[];
  slowProductIds: Set<string>;
  demandByProduct: Map<string, number>;
}

export function buildCatalog(seeds: ProductSeed[], rng: Rng, now: Date): BuiltCatalog {
  const products: Product[] = [];
  const variants: Variant[] = [];
  const slowProductIds = new Set<string>();
  const demandByProduct = new Map<string, number>();
  for (const seed of seeds) {
    const createdAt = new Date(now.getTime() - randInt(rng, 120, 420) * DAY).toISOString();
    products.push({
      id: seed.id,
      name: seed.name,
      type: seed.type,
      status: seed.status,
      category: seed.category,
      brand: seed.brand,
      supplier: seed.supplier,
      description: seed.description,
      optionNames: seed.optionNames,
      reorderPoint: seed.reorderPoint,
      reorderQty: seed.reorderQty,
      bundle: [],
      createdAt: seed.status === 'draft' ? new Date(now.getTime() - 6 * DAY).toISOString() : createdAt
    });
    if (seed.slowMover) slowProductIds.add(seed.id);
    demandByProduct.set(seed.id, seed.demand);
    seed.variants.forEach((v, index) => {
      const title = Object.values(v.options).join(' / ') || 'Default';
      variants.push({
        id: `${seed.id}-v${index + 1}`,
        productId: seed.id,
        title,
        options: v.options,
        sku: v.sku,
        barcode: ean13(rng),
        price: rupeesToCents(v.price),
        wholesalePrice: v.wholesale ? rupeesToCents(v.wholesale) : null,
        compareAtPrice: v.compareAt ? rupeesToCents(v.compareAt) : null,
        cost: rupeesToCents(v.cost)
      });
    });
  }
  // Resolve bundle components by SKU and roll up the kit cost from its components.
  for (const seed of seeds) {
    if (!seed.bundle) continue;
    const product = products.find((p) => p.id === seed.id)!;
    product.bundle = seed.bundle.map((c) => {
      const variant = variants.find((v) => v.sku === c.sku);
      if (!variant) throw new Error(`Bundle component not found: ${c.sku}`);
      return { variantId: variant.id, quantity: c.quantity };
    });
    const kit = variants.find((v) => v.productId === seed.id)!;
    kit.cost = product.bundle.reduce((sum, c) => sum + (variants.find((v) => v.id === c.variantId)?.cost ?? 0) * c.quantity, 0);
  }
  return { products, variants, slowProductIds, demandByProduct };
}