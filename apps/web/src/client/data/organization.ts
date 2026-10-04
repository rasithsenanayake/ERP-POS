import type { Branch, Company, Organization, Permission, Role, User, Warehouse } from '../types/org';

export const organization: Organization = { id: 'org-serendib', name: 'Serendib Retail Group' };

export const company: Company = {
  id: 'co-lifestyle',
  organizationId: 'org-serendib',
  name: 'Serendib Lifestyle (Pvt) Ltd',
  currency: 'LKR',
  timezone: 'Asia/Colombo',
  taxRateBps: 1800,
  taxLabel: 'VAT',
  registrationNo: 'PV 00218745'
};

export const branches: Branch[] = [
{
  id: 'br-col',
  companyId: 'co-lifestyle',
  name: 'Colombo 07 Flagship',
  shortName: 'Colombo 07',
  city: 'Colombo',
  address: '42 Ward Place, Colombo 07',
  warehouseId: 'wh-col'
},
{
  id: 'br-kdy',
  companyId: 'co-lifestyle',
  name: 'Kandy City Centre',
  shortName: 'Kandy',
  city: 'Kandy',
  address: 'Level 2, Kandy City Centre, Dalada Veediya, Kandy',
  warehouseId: 'wh-kdy'
},
{
  id: 'br-gal',
  companyId: 'co-lifestyle',
  name: 'Galle Fort Store',
  shortName: 'Galle',
  city: 'Galle',
  address: '18 Church Street, Galle Fort',
  warehouseId: 'wh-gal'
}];


export const warehouses: Warehouse[] = [
{ id: 'wh-col', name: 'Colombo 07 Stockroom', code: 'COL-S', branchId: 'br-col', kind: 'store' },
{ id: 'wh-kdy', name: 'Kandy Stockroom', code: 'KDY-S', branchId: 'br-kdy', kind: 'store' },
{ id: 'wh-gal', name: 'Galle Stockroom', code: 'GAL-S', branchId: 'br-gal', kind: 'store' },
{ id: 'wh-kel', name: 'Kelaniya Central Warehouse', code: 'KEL-C', branchId: null, kind: 'central' }];


export const users: User[] = [
{ id: 'u-nimali', name: 'Nimali Perera', initials: 'NP', email: 'nimali@serendib.lk', role: 'owner', branchId: null, title: 'Managing Director', kind: 'person' },
{ id: 'u-kasun', name: 'Kasun Jayawardena', initials: 'KJ', email: 'kasun@serendib.lk', role: 'branch_manager', branchId: 'br-kdy', title: 'Branch Manager, Kandy', kind: 'person' },
{ id: 'u-tharushi', name: 'Tharushi Fernando', initials: 'TF', email: 'tharushi@serendib.lk', role: 'salesperson', branchId: 'br-col', title: 'Sales Associate', kind: 'person' },
{ id: 'u-ruwan', name: 'Ruwan Silva', initials: 'RS', email: 'ruwan@serendib.lk', role: 'salesperson', branchId: 'br-col', title: 'Senior Sales Associate', kind: 'person' },
{ id: 'u-dilshan', name: 'Dilshan Gunasekara', initials: 'DG', email: 'dilshan@serendib.lk', role: 'salesperson', branchId: 'br-kdy', title: 'Sales Associate', kind: 'person' },
{ id: 'u-sachini', name: 'Sachini Wickramasinghe', initials: 'SW', email: 'sachini@serendib.lk', role: 'salesperson', branchId: 'br-gal', title: 'Store Lead, Galle', kind: 'person' },
{ id: 'u-ishara', name: 'Ishara Bandara', initials: 'IB', email: 'ishara@serendib.lk', role: 'warehouse_staff', branchId: null, title: 'Warehouse Lead, Kelaniya', kind: 'person' },
{ id: 'u-system', name: 'serendib.lk', initials: 'SL', email: 'orders@serendib.lk', role: 'warehouse_staff', branchId: null, title: 'Online storefront', kind: 'system' }];


export const allPermissions: Permission[] = [
'orders.view',
'orders.create',
'orders.update',
'orders.cancel',
'orders.refund',
'payments.record',
'customers.view',
'customers.manage',
'products.view',
'products.manage',
'products.view_cost',
'inventory.view',
'inventory.adjust',
'inventory.transfer',
'purchasing.manage',
'finance.view',
'finance.approve',
'crm.manage',
'marketing.manage',
'support.manage',
'hr.view',
'hr.manage',
'projects.manage',
'automation.manage',
'integrations.manage',
'team.manage',
'settings.manage',
'audit.view'];


const ownerOnly: Permission[] = ['settings.manage', 'team.manage', 'integrations.manage'];

export const roles: Role[] = [
{ key: 'owner', name: 'Owner', scope: 'ORGANIZATION', permissions: allPermissions },
{
  key: 'branch_manager',
  name: 'Branch Manager',
  scope: 'BRANCH',
  permissions: allPermissions.filter((p) => !ownerOnly.includes(p))
},
{
  key: 'salesperson',
  name: 'Salesperson',
  scope: 'OWN',
  permissions: ['orders.view', 'orders.create', 'orders.update', 'payments.record', 'customers.view', 'customers.manage', 'products.view', 'inventory.view', 'crm.manage', 'support.manage', 'projects.manage']
},
{
  key: 'warehouse_staff',
  name: 'Warehouse Staff',
  scope: 'ORGANIZATION',
  permissions: ['products.view', 'inventory.view', 'inventory.adjust', 'inventory.transfer', 'purchasing.manage', 'projects.manage']
},
{
  key: 'accountant',
  name: 'Accountant',
  scope: 'ORGANIZATION',
  permissions: ['orders.view', 'payments.record', 'customers.view', 'products.view', 'products.view_cost', 'inventory.view', 'finance.view', 'finance.approve', 'hr.view', 'audit.view', 'projects.manage']
},
{
  key: 'support_agent',
  name: 'Support Agent',
  scope: 'ORGANIZATION',
  permissions: ['orders.view', 'customers.view', 'customers.manage', 'products.view', 'inventory.view', 'support.manage', 'crm.manage', 'projects.manage']
}];


export const assignableRoles: {key: Role['key'];description: string;}[] = [
{ key: 'owner', description: 'Full access, including team, billing and settings.' },
{ key: 'branch_manager', description: 'Runs one branch: sales, stock, staff and approvals.' },
{ key: 'salesperson', description: 'Sells and serves their own customers. Works the POS.' },
{ key: 'warehouse_staff', description: 'Receives, counts and moves stock. Handles purchasing.' },
{ key: 'accountant', description: 'Finance, payments, payroll and the audit log. Read-only sales.' },
{ key: 'support_agent', description: 'Works the support inbox and CRM across all branches.' }];