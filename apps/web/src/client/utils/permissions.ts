import type { Permission, Role, User, Warehouse } from '../types/org';
import type { Customer, Order } from '../types/sales';

export function roleCan(role: Role, permission: Permission): boolean {
  return role.permissions.includes(permission);
}

/** Resolves the branch a user is effectively looking at. Branch-scoped roles are pinned to their branch. */
export function resolveBranch(user: User, role: Role, selected: string): string | null {
  if (role.scope === 'BRANCH') return user.branchId;
  return selected === 'all' ? null : selected;
}

export function canAccessOrder(order: Order, user: User, role: Role): boolean {
  if (role.scope === 'ORGANIZATION') return true;
  if (role.scope === 'BRANCH') return order.branchId === user.branchId;
  return order.assignedTo === user.id || order.createdBy === user.id;
}

export function scopeOrders(orders: Order[], user: User, role: Role, branchId: string | null): Order[] {
  return orders.filter((order) => canAccessOrder(order, user, role) && (!branchId || order.branchId === branchId));
}

export function canAccessCustomer(customer: Customer, user: User, role: Role): boolean {
  if (role.scope === 'ORGANIZATION') return true;
  if (role.scope === 'BRANCH') return customer.branchId === user.branchId;
  return customer.salespersonId === user.id;
}

export function scopeCustomers(customers: Customer[], user: User, role: Role, branchId: string | null): Customer[] {
  return customers.filter((customer) => canAccessCustomer(customer, user, role) && (!branchId || customer.branchId === branchId));
}

/** Stock visibility: everyone may check stock, but the branch filter narrows it to that store's stockroom. */
export function scopeWarehouses(warehouses: Warehouse[], branchId: string | null): Warehouse[] {
  if (!branchId) return warehouses;
  return warehouses.filter((w) => w.branchId === branchId);
}

export const scopeLabels: Record<Role['scope'], string> = {
  ORGANIZATION: 'Entire organization',
  BRANCH: 'Own branch',
  OWN: 'Own records'
};