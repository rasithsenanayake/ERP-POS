import type { ModuleKey } from '../types/org';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  phase: number;
  implemented: boolean;
  required: boolean;
  defaultEnabled: boolean;
}

export const moduleDefinitions: ModuleDefinition[] = [
{ key: 'sales', name: 'Sales', description: 'Orders, customers, payments and fulfilment.', phase: 1, implemented: true, required: false, defaultEnabled: true },
{ key: 'products', name: 'Products', description: 'Catalog, variants, pricing and bundles.', phase: 1, implemented: true, required: true, defaultEnabled: true },
{ key: 'inventory', name: 'Inventory', description: 'Stock levels, ledger, adjustments and transfers.', phase: 1, implemented: true, required: false, defaultEnabled: true },
{ key: 'pos', name: 'Point of Sale', description: 'Touch-first checkout, cash registers and receipts.', phase: 2, implemented: true, required: false, defaultEnabled: true },
{ key: 'purchasing', name: 'Purchasing', description: 'Purchase orders, goods receipts and suppliers.', phase: 2, implemented: true, required: false, defaultEnabled: true },
{ key: 'finance', name: 'Finance', description: 'Profit & loss, receivables and expenses.', phase: 3, implemented: true, required: false, defaultEnabled: true },
{ key: 'crm', name: 'CRM', description: 'Deals, pipelines and sales activities.', phase: 4, implemented: true, required: false, defaultEnabled: true },
{ key: 'marketing', name: 'Marketing', description: 'Campaigns, promotions and loyalty.', phase: 4, implemented: true, required: false, defaultEnabled: true },
{ key: 'support', name: 'Support', description: 'Tickets, shared inbox and service levels.', phase: 4, implemented: true, required: false, defaultEnabled: true },
{ key: 'hr', name: 'HR & Payroll', description: 'Employees, attendance, leave and payroll.', phase: 5, implemented: true, required: false, defaultEnabled: true },
{ key: 'projects', name: 'Projects', description: 'Projects, tasks and time tracking.', phase: 6, implemented: true, required: false, defaultEnabled: true },
{ key: 'reports', name: 'Reports', description: 'Ready-made reports with CSV export.', phase: 6, implemented: true, required: false, defaultEnabled: true },
{ key: 'automation', name: 'Automation', description: 'When–if–then workflows that connect modules.', phase: 6, implemented: true, required: false, defaultEnabled: true },
{ key: 'integrations', name: 'Apps & integrations', description: 'Payment gateways, couriers, messaging and webhooks.', phase: 6, implemented: true, required: false, defaultEnabled: true }];