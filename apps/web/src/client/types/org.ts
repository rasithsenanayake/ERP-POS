export type ModuleKey =
'sales' |
'products' |
'inventory' |
'pos' |
'purchasing' |
'finance' |
'crm' |
'marketing' |
'support' |
'hr' |
'projects' |
'reports' |
'automation' |
'integrations';

export interface Organization {
  id: string;
  name: string;
}

export interface Company {
  id: string;
  organizationId: string;
  name: string;
  currency: 'LKR';
  timezone: string;
  taxRateBps: number;
  taxLabel: string;
  registrationNo: string;
  /** Printed at the bottom of POS receipts and invoices. */
  receiptFooter?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
  warehouseId: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string | null;
  kind: 'store' | 'central';
}

export type RoleKey = 'owner' | 'branch_manager' | 'salesperson' | 'warehouse_staff' | 'accountant' | 'support_agent';

export type PreviewRole = 'owner' | 'branch_manager' | 'salesperson';

export type Permission =
'orders.view' |
'orders.create' |
'orders.update' |
'orders.cancel' |
'orders.refund' |
'payments.record' |
'customers.view' |
'customers.manage' |
'products.view' |
'products.manage' |
'products.view_cost' |
'inventory.view' |
'inventory.adjust' |
'inventory.transfer' |
'purchasing.manage' |
'finance.view' |
'finance.approve' |
'crm.manage' |
'marketing.manage' |
'support.manage' |
'hr.view' |
'hr.manage' |
'projects.manage' |
'automation.manage' |
'integrations.manage' |
'team.manage' |
'settings.manage' |
'audit.view';

export type DataScope = 'ORGANIZATION' | 'BRANCH' | 'OWN';

export interface Role {
  key: RoleKey;
  name: string;
  scope: DataScope;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: RoleKey;
  branchId: string | null;
  title: string;
  kind: 'person' | 'system';
  /** Deactivated members keep their history but can no longer sign in or be assigned work. */
  active?: boolean;
  /** Invited but not yet registered. */
  invited?: boolean;
}
