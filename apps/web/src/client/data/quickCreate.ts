import type { ModuleKey, Permission } from '../types/org';
import type { DrawerKind } from '../types/system';

export interface QuickCreateAction {
  id: string;
  label: string;
  /** Opens a global drawer. */
  kind?: DrawerKind;
  /** Or navigates to the module where the record is created. */
  to?: string;
  module?: ModuleKey;
  permission?: Permission;
  available: boolean;
}

export const quickCreateActions: QuickCreateAction[] = [
{ id: 'order', label: 'New order', kind: 'order', module: 'sales', permission: 'orders.create', available: true },
{ id: 'customer', label: 'New customer', kind: 'customer', module: 'sales', permission: 'customers.manage', available: true },
{ id: 'product', label: 'New product', kind: 'product', module: 'products', permission: 'products.manage', available: true },
{ id: 'adjust', label: 'Stock adjustment', kind: 'adjust', module: 'inventory', permission: 'inventory.adjust', available: true },
{ id: 'transfer', label: 'Stock transfer', kind: 'transfer', module: 'inventory', permission: 'inventory.transfer', available: true },
{ id: 'sale', label: 'New POS sale', to: '/pos', module: 'pos', permission: 'orders.create', available: true },
{ id: 'purchase_order', label: 'New purchase order', to: '/purchasing', module: 'purchasing', permission: 'inventory.view', available: true },
{ id: 'expense', label: 'Record expense', to: '/finance', module: 'finance', permission: 'products.view_cost', available: true },
{ id: 'deal', label: 'New deal', to: '/crm', module: 'crm', permission: 'customers.view', available: true },
{ id: 'campaign', label: 'New campaign', to: '/marketing', module: 'marketing', permission: 'customers.manage', available: true }];