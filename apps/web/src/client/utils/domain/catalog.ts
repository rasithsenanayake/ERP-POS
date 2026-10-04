import type { ErpState } from '../../types/erp';
import type { Product, ProductStatus, Variant } from '../../types/catalog';
import { DomainError } from '../errors';
import { createId } from '../ids';
import { assertCan, DomainContext, DomainResult, withAudit } from './helpers';

export interface ProductInput {
  name: string;
  type: 'physical' | 'service';
  status: ProductStatus;
  category: string;
  brand: string;
  supplier: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  wholesalePrice: number | null;
  cost: number;
  sku: string;
  barcode: string;
  reorderPoint: number;
  reorderQty: number;
}

export function createProduct(state: ErpState, input: ProductInput, ctx: DomainContext): DomainResult<Product> {
  assertCan(ctx, 'products.manage');
  const sku = input.sku.trim().toUpperCase();
  if (state.variants.some((v) => v.sku.toUpperCase() === sku)) throw new DomainError('DUPLICATE', `SKU ${sku} is already used by another product.`);
  const barcode = input.barcode.trim();
  if (barcode && state.variants.some((v) => v.barcode === barcode)) throw new DomainError('DUPLICATE', `Barcode ${barcode} is already assigned.`);
  if (input.compareAtPrice !== null && input.compareAtPrice <= input.price) {
    throw new DomainError('VALIDATION', 'Compare-at price should be higher than the selling price.');
  }
  const at = ctx.now.toISOString();
  const product: Product = {
    id: createId('prd'),
    name: input.name.trim(),
    type: input.type,
    status: input.status,
    category: input.category,
    brand: input.brand.trim(),
    supplier: input.supplier.trim(),
    description: input.description.trim(),
    optionNames: [],
    reorderPoint: input.type === 'service' ? 0 : input.reorderPoint,
    reorderQty: input.type === 'service' ? 0 : input.reorderQty,
    bundle: [],
    createdAt: at
  };
  const variant: Variant = {
    id: createId('var'),
    productId: product.id,
    title: 'Default',
    options: {},
    sku,
    barcode,
    price: input.price,
    wholesalePrice: input.wholesalePrice,
    compareAtPrice: input.compareAtPrice,
    cost: input.cost
  };
  let next: ErpState = {
    ...state,
    products: [...state.products, product],
    variants: [...state.variants, variant],
    sequences: { ...state.sequences, product: state.sequences.product + 1 }
  };
  next = withAudit(next, ctx, { action: 'product.created', resource: 'Product', resourceId: product.id, resourceLabel: product.name, changes: [] });
  return { state: next, result: product };
}