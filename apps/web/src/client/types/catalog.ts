export type ProductType = 'physical' | 'service' | 'bundle';
export type ProductStatus = 'active' | 'draft' | 'archived';

export interface BundleComponent {
  variantId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  category: string;
  brand: string;
  supplier: string;
  description: string;
  optionNames: string[];
  reorderPoint: number;
  reorderQty: number;
  bundle: BundleComponent[];
  createdAt: string;
}

export interface Variant {
  id: string;
  productId: string;
  title: string;
  options: Record<string, string>;
  sku: string;
  barcode: string;
  /** All money values are integer cents (LKR). */
  price: number;
  wholesalePrice: number | null;
  compareAtPrice: number | null;
  cost: number;
}

export interface VariantSeed {
  options: Record<string, string>;
  sku: string;
  /** Rupees in seed data; converted to cents when built. */
  price: number;
  cost: number;
  wholesale?: number;
  compareAt?: number;
}

export interface ProductSeed {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  category: string;
  brand: string;
  supplier: string;
  description: string;
  optionNames: string[];
  reorderPoint: number;
  reorderQty: number;
  demand: number;
  slowMover?: boolean;
  variants: VariantSeed[];
  bundle?: {sku: string;quantity: number;}[];
}