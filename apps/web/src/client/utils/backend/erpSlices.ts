import type { ErpState } from '../../types/erp';
import type { ModuleKey } from '../../types/org';
import { moduleDefinitions } from '../../data/modules';
import { roles } from '../../data/organization';
import { buildInitialState } from '../seed';
import type { DataStore } from './store';

/** Roles are product configuration and always come from code, so permission fixes reach saved workspaces. */
const SLICES = [
'organization',
'company',
'branches',
'warehouses',
'users',
'products',
'variants',
'customers',
'orders',
'balances',
'ledger',
'transfers',
'notifications',
'audit',
'modules',
'sequences'] as
const;

type Slice = (typeof SLICES)[number];

const PREFIX = 'erp.';

export function sliceFromKey(key: string): Slice | null {
  if (!key.startsWith(PREFIX)) return null;
  const slice = key.slice(PREFIX.length) as Slice;
  return (SLICES as readonly string[]).includes(slice) ? slice : null;
}

/** Loads the ERP from the store, seeding demo data the first time a workspace opens. */
export function hydrateErpState(store: DataStore): ErpState {
  const hasData = store.peek(`${PREFIX}sequences`) !== undefined;
  if (!hasData) {
    const seeded = buildInitialState(new Date());
    for (const slice of SLICES) store.set(PREFIX + slice, seeded[slice]);
    return seeded;
  }
  let fallback: ErpState | null = null;
  const seed = () => fallback ??= buildInitialState(new Date());
  const read = <K extends Slice,>(slice: K): ErpState[K] => {
    const value = store.peek<ErpState[K]>(PREFIX + slice);
    if (value !== undefined) return value;
    const v = seed()[slice];
    store.set(PREFIX + slice, v);
    return v;
  };
  const storedModules = read('modules');
  const modules = Object.fromEntries(moduleDefinitions.map((m) => [m.key, storedModules[m.key] ?? m.defaultEnabled])) as Record<ModuleKey, boolean>;
  return {
    organization: read('organization'),
    company: read('company'),
    branches: read('branches'),
    warehouses: read('warehouses'),
    users: read('users'),
    roles,
    products: read('products'),
    variants: read('variants'),
    customers: read('customers'),
    orders: read('orders'),
    balances: read('balances'),
    ledger: read('ledger'),
    transfers: read('transfers'),
    notifications: read('notifications'),
    audit: read('audit'),
    modules,
    sequences: read('sequences')
  };
}

/** Writes only the slices whose reference changed. */
export function persistChangedSlices(store: DataStore, prev: ErpState, next: ErpState, origin: string): void {
  for (const slice of SLICES) {
    if (prev[slice] !== next[slice]) store.set(PREFIX + slice, next[slice], origin);
  }
}