import type { ErpState } from '../../types/erp';
import type { Branch, Company, RoleKey, User, Warehouse } from '../../types/org';
import { DomainError } from '../errors';
import { createId } from '../ids';
import { assertCan, DomainContext, DomainResult, withAudit } from './helpers';

export type CompanyInput = Pick<Company, 'name' | 'registrationNo' | 'taxLabel' | 'taxRateBps' | 'receiptFooter' | 'phone' | 'email' | 'address'>;

export function updateCompany(state: ErpState, input: CompanyInput, ctx: DomainContext): DomainResult<Company> {
  assertCan(ctx, 'settings.manage', 'Only owners can change company details.');
  if (!input.name.trim()) throw new DomainError('VALIDATION', 'Company name is required.');
  if (!Number.isInteger(input.taxRateBps) || input.taxRateBps < 0 || input.taxRateBps > 5000) throw new DomainError('VALIDATION', 'Tax rate must be between 0% and 50%.');
  const before = state.company;
  const company: Company = { ...before, ...input, name: input.name.trim(), taxLabel: input.taxLabel.trim() || 'Tax' };
  const changes = (Object.keys(input) as (keyof CompanyInput)[]).
  filter((k) => String(before[k] ?? '') !== String(company[k] ?? '')).
  map((k) => ({ field: k, from: String(before[k] ?? '—'), to: String(company[k] ?? '—') }));
  if (changes.length === 0) return { state, result: before };
  const next = withAudit({ ...state, company }, ctx, { action: 'company.updated', resource: 'Company', resourceId: company.id, resourceLabel: company.name, changes });
  return { state: next, result: company };
}

export interface BranchInput {
  id?: string;
  name: string;
  shortName: string;
  city: string;
  address: string;
}

export function saveBranch(state: ErpState, input: BranchInput, ctx: DomainContext): DomainResult<Branch> {
  assertCan(ctx, 'settings.manage', 'Only owners can add or edit branches.');
  const name = input.name.trim();
  const shortName = input.shortName.trim() || name;
  if (!name) throw new DomainError('VALIDATION', 'Branch name is required.');
  if (state.branches.some((b) => b.id !== input.id && b.name.toLowerCase() === name.toLowerCase())) throw new DomainError('DUPLICATE', 'A branch with this name already exists.');

  if (input.id) {
    const existing = state.branches.find((b) => b.id === input.id);
    if (!existing) throw new DomainError('NOT_FOUND', 'This branch no longer exists.');
    const branch: Branch = { ...existing, name, shortName, city: input.city.trim(), address: input.address.trim() };
    const next = withAudit({ ...state, branches: state.branches.map((b) => b.id === branch.id ? branch : b) }, ctx, {
      action: 'branch.updated',
      resource: 'Branch',
      resourceId: branch.id,
      resourceLabel: branch.name,
      changes: existing.name !== name ? [{ field: 'name', from: existing.name, to: name }] : []
    });
    return { state: next, result: branch };
  }

  const branchId = createId('br');
  const code = `${shortName.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'BR'}-S`;
  const warehouse: Warehouse = { id: createId('wh'), name: `${shortName} Stockroom`, code, branchId, kind: 'store' };
  const branch: Branch = { id: branchId, companyId: state.company.id, name, shortName, city: input.city.trim(), address: input.address.trim(), warehouseId: warehouse.id };
  const next = withAudit({ ...state, branches: [...state.branches, branch], warehouses: [...state.warehouses, warehouse] }, ctx, {
    action: 'branch.created',
    resource: 'Branch',
    resourceId: branch.id,
    resourceLabel: branch.name,
    changes: [{ field: 'stockroom', from: '—', to: warehouse.code }]
  });
  return { state: next, result: branch };
}

export interface MemberInput {
  name: string;
  email: string;
  title: string;
  role: RoleKey;
  branchId: string | null;
}

function initialsOf(name: string): string {
  return name.
  split(/\s+/).
  filter(Boolean).
  slice(0, 2).
  map((p) => p[0]!.toUpperCase()).
  join('');
}

function roleName(state: ErpState, key: RoleKey) {
  return state.roles.find((r) => r.key === key)?.name ?? key;
}

function validateMember(state: ErpState, input: MemberInput, selfId?: string) {
  if (!input.name.trim()) throw new DomainError('VALIDATION', 'Name is required.');
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new DomainError('VALIDATION', 'Enter a valid email address.');
  if (state.users.some((u) => u.id !== selfId && u.email.toLowerCase() === input.email.trim().toLowerCase())) throw new DomainError('DUPLICATE', 'Someone with this email is already on the team.');
  const role = state.roles.find((r) => r.key === input.role);
  if (!role) throw new DomainError('VALIDATION', 'Choose a role.');
  if (role.scope !== 'ORGANIZATION' && !input.branchId) throw new DomainError('VALIDATION', `${role.name}s must belong to a branch.`);
}

export function inviteMember(state: ErpState, input: MemberInput, ctx: DomainContext, invited: boolean): DomainResult<User> {
  assertCan(ctx, 'team.manage', 'Only owners can invite teammates.');
  validateMember(state, input);
  const user: User = {
    id: createId('u'),
    name: input.name.trim(),
    initials: initialsOf(input.name),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    branchId: input.branchId,
    title: input.title.trim() || roleName(state, input.role),
    kind: 'person',
    active: true,
    invited
  };
  const next = withAudit({ ...state, users: [...state.users, user] }, ctx, {
    action: 'user.invited',
    resource: 'User',
    resourceId: user.id,
    resourceLabel: user.name,
    changes: [{ field: 'role', from: '—', to: roleName(state, user.role) }]
  });
  return { state: next, result: user };
}

function assertKeepsAnOwner(state: ErpState, userId: string, nextRole: RoleKey | null) {
  const owners = state.users.filter((u) => u.role === 'owner' && u.active !== false && u.kind === 'person');
  if (owners.length === 1 && owners[0]!.id === userId && nextRole !== 'owner') throw new DomainError('INVALID_STATE', 'Every workspace needs at least one active owner.');
}

export function updateMember(state: ErpState, userId: string, input: MemberInput, ctx: DomainContext): DomainResult<User> {
  assertCan(ctx, 'team.manage', 'Only owners can change roles.');
  const existing = state.users.find((u) => u.id === userId);
  if (!existing) throw new DomainError('NOT_FOUND', 'This person is no longer on the team.');
  validateMember(state, input, userId);
  assertKeepsAnOwner(state, userId, input.role);
  const user: User = { ...existing, name: input.name.trim(), initials: initialsOf(input.name), email: input.email.trim().toLowerCase(), title: input.title.trim(), role: input.role, branchId: input.branchId };
  const changes = [
  existing.role !== user.role && { field: 'role', from: roleName(state, existing.role), to: roleName(state, user.role) },
  existing.branchId !== user.branchId && { field: 'branch', from: existing.branchId ?? 'All', to: user.branchId ?? 'All' },
  existing.name !== user.name && { field: 'name', from: existing.name, to: user.name }].
  filter(Boolean) as {field: string;from: string;to: string;}[];
  const next = withAudit({ ...state, users: state.users.map((u) => u.id === userId ? user : u) }, ctx, {
    action: 'user.updated',
    resource: 'User',
    resourceId: user.id,
    resourceLabel: user.name,
    changes
  });
  return { state: next, result: user };
}

export function setMemberActive(state: ErpState, userId: string, active: boolean, ctx: DomainContext): DomainResult<User> {
  assertCan(ctx, 'team.manage', 'Only owners can deactivate teammates.');
  const existing = state.users.find((u) => u.id === userId);
  if (!existing) throw new DomainError('NOT_FOUND', 'This person is no longer on the team.');
  if (existing.id === ctx.user.id) throw new DomainError('INVALID_STATE', "You can't deactivate yourself.");
  if (!active) assertKeepsAnOwner(state, userId, null);
  const user: User = { ...existing, active };
  const next = withAudit({ ...state, users: state.users.map((u) => u.id === userId ? user : u) }, ctx, {
    action: active ? 'user.reactivated' : 'user.deactivated',
    resource: 'User',
    resourceId: user.id,
    resourceLabel: user.name,
    changes: [{ field: 'status', from: active ? 'Deactivated' : 'Active', to: active ? 'Active' : 'Deactivated' }]
  });
  return { state: next, result: user };
}