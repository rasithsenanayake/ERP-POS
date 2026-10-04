import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
  FileSpreadsheetIcon,
  FolderKanbanIcon,
  HandshakeIcon,
  HouseIcon,
  LandmarkIcon,
  LifeBuoyIcon,
  MegaphoneIcon,
  MonitorSmartphoneIcon,
  ReceiptTextIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  WorkflowIcon } from
'lucide-react';
import type { ModuleKey } from '../types/org';

export interface NavChild {
  label: string;
  to: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  module?: ModuleKey;
  children?: NavChild[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const primaryNav: NavItem[] = [
{ id: 'home', label: 'Home', icon: HouseIcon, to: '/dashboard' },
{
  id: 'sales',
  label: 'Sales',
  icon: ReceiptTextIcon,
  to: '/orders',
  module: 'sales',
  children: [
  { label: 'Orders', to: '/orders' },
  { label: 'Customers', to: '/customers' }]

},
{ id: 'pos', label: 'Point of Sale', icon: MonitorSmartphoneIcon, to: '/pos', module: 'pos' },
{ id: 'products', label: 'Products', icon: TagIcon, to: '/products', module: 'products' },
{
  id: 'inventory',
  label: 'Inventory',
  icon: WarehouseIcon,
  to: '/inventory',
  module: 'inventory',
  children: [
  { label: 'Stock levels', to: '/inventory' },
  { label: 'Stock ledger', to: '/inventory/ledger' },
  { label: 'Transfers', to: '/inventory/transfers' }]

},
{ id: 'purchasing', label: 'Purchasing', icon: TruckIcon, to: '/purchasing', module: 'purchasing' },
{ id: 'finance', label: 'Finance', icon: LandmarkIcon, to: '/finance', module: 'finance' }];


export const navSections: NavSection[] = [
{
  label: 'Customers',
  items: [
  { id: 'crm', label: 'CRM', icon: HandshakeIcon, to: '/crm', module: 'crm' },
  { id: 'marketing', label: 'Marketing', icon: MegaphoneIcon, to: '/marketing', module: 'marketing' },
  { id: 'support', label: 'Support', icon: LifeBuoyIcon, to: '/support', module: 'support' }]

},
{
  label: 'Workspace',
  items: [
  { id: 'hr', label: 'HR & Payroll', icon: UsersIcon, to: '/hr', module: 'hr' },
  { id: 'projects', label: 'Projects', icon: FolderKanbanIcon, to: '/projects', module: 'projects' },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheetIcon, to: '/reports', module: 'reports' },
  { id: 'automation', label: 'Automation', icon: WorkflowIcon, to: '/automation', module: 'automation' },
  { id: 'integrations', label: 'Apps', icon: BlocksIcon, to: '/apps', module: 'integrations' }]

}];


/** Old /m/:moduleKey links (favorites, bookmarks) resolve to the module's real route. */
export const legacyModuleRoutes: Partial<Record<ModuleKey, string>> = {
  pos: '/pos',
  purchasing: '/purchasing',
  finance: '/finance',
  crm: '/crm',
  marketing: '/marketing',
  support: '/support',
  hr: '/hr',
  projects: '/projects',
  reports: '/reports',
  automation: '/automation',
  integrations: '/apps'
};