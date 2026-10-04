import type { Branch, Company, ModuleKey, Organization, Role, User, Warehouse } from './org';
import type { Product, Variant } from './catalog';
import type { LedgerEntry, StockBalance, Transfer } from './inventory';
import type { Customer, Order } from './sales';
import type { AppNotification, AuditEntry } from './system';

export interface ErpSequences {
  order: number;
  customer: number;
  transfer: number;
  adjustment: number;
  product: number;
  ledger: number;
}

export interface ErpState {
  organization: Organization;
  company: Company;
  branches: Branch[];
  warehouses: Warehouse[];
  users: User[];
  roles: Role[];
  products: Product[];
  variants: Variant[];
  customers: Customer[];
  orders: Order[];
  balances: Record<string, StockBalance>;
  ledger: LedgerEntry[];
  transfers: Transfer[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  modules: Record<ModuleKey, boolean>;
  sequences: ErpSequences;
}