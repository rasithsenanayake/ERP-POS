import type { ErpState } from '../../types/erp';
import type { Customer, PaymentTerms } from '../../types/sales';
import { DomainError } from '../errors';
import { createId, sequenceLabel } from '../ids';
import { formatMoney } from '../money';
import { termsLabel } from '../orderMath';
import { canAccessCustomer } from '../permissions';
import { assertCan, DomainContext, DomainResult, timelineEvent, withAudit } from './helpers';

export interface CustomerInput {
  name: string;
  type: 'individual' | 'business';
  company: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  tags: string[];
  salespersonId: string;
  branchId: string;
  paymentTerms: PaymentTerms;
  creditLimit: number;
  taxId: string;
}

const digits = (value: string) => value.replace(/\D/g, '');

function assertUnique(state: ErpState, input: CustomerInput, exceptId?: string) {
  const phone = digits(input.phone);
  const email = input.email.trim().toLowerCase();
  const clash = state.customers.find(
    (c) => c.id !== exceptId && (phone && digits(c.phone) === phone || email && c.email.toLowerCase() === email)
  );
  if (clash) {
    throw new DomainError('DUPLICATE', `${clash.name} (${clash.number}) already uses this ${digits(clash.phone) === phone ? 'phone number' : 'email'}.`);
  }
}

export function createCustomer(state: ErpState, input: CustomerInput, ctx: DomainContext): DomainResult<Customer> {
  assertCan(ctx, 'customers.manage');
  assertUnique(state, input);
  if (ctx.role.scope === 'BRANCH' && input.branchId !== ctx.user.branchId) {
    throw new DomainError('FORBIDDEN', 'You can only add customers to your own branch.');
  }
  const seq = state.sequences.customer + 1;
  const at = ctx.now.toISOString();
  const customer: Customer = {
    id: createId('cus'),
    number: sequenceLabel('CUS', seq),
    name: input.name.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    secondaryPhone: input.secondaryPhone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    type: input.type,
    tags: input.tags,
    source: 'Manual entry',
    salespersonId: ctx.role.scope === 'OWN' ? ctx.user.id : input.salespersonId,
    branchId: input.branchId,
    creditLimit: input.creditLimit,
    paymentTerms: input.paymentTerms,
    taxId: input.taxId.trim(),
    loyaltyPoints: 0,
    createdAt: at,
    activity: [timelineEvent('created', 'Customer created', ctx.user.id, at)],
    notes: []
  };
  let next: ErpState = { ...state, customers: [...state.customers, customer], sequences: { ...state.sequences, customer: seq } };
  next = withAudit(next, ctx, { action: 'customer.created', resource: 'Customer', resourceId: customer.id, resourceLabel: customer.name, changes: [] });
  return { state: next, result: customer };
}

export function updateCustomer(state: ErpState, id: string, input: CustomerInput, ctx: DomainContext): DomainResult<Customer> {
  assertCan(ctx, 'customers.manage');
  const existing = state.customers.find((c) => c.id === id);
  if (!existing) throw new DomainError('NOT_FOUND', 'This customer no longer exists.');
  if (!canAccessCustomer(existing, ctx.user, ctx.role)) throw new DomainError('FORBIDDEN', 'This customer is outside your access scope.');
  assertUnique(state, input, id);
  const at = ctx.now.toISOString();
  const changes: {field: string;from: string;to: string;}[] = [];
  const compare = (field: string, from: string, to: string) => {
    if (from !== to) changes.push({ field, from: from || '—', to: to || '—' });
  };
  compare('name', existing.name, input.name.trim());
  compare('email', existing.email, input.email.trim());
  compare('phone', existing.phone, input.phone.trim());
  compare('company', existing.company, input.company.trim());
  compare('city', existing.city, input.city.trim());
  compare('payment terms', termsLabel[existing.paymentTerms], termsLabel[input.paymentTerms]);
  compare('credit limit', formatMoney(existing.creditLimit), formatMoney(input.creditLimit));
  compare('salesperson', state.users.find((u) => u.id === existing.salespersonId)?.name ?? '', state.users.find((u) => u.id === input.salespersonId)?.name ?? '');
  const added = input.tags.filter((t) => !existing.tags.includes(t));
  const removed = existing.tags.filter((t) => !input.tags.includes(t));
  const activity = [...existing.activity];
  for (const tag of added) activity.push(timelineEvent('tag', `Tag ${tag} added`, ctx.user.id, at));
  for (const tag of removed) activity.push(timelineEvent('tag', `Tag ${tag} removed`, ctx.user.id, at));
  if (changes.length) activity.push(timelineEvent('updated', `Updated ${changes.map((c) => c.field).join(', ')}`, ctx.user.id, at));
  const updated: Customer = {
    ...existing,
    name: input.name.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    secondaryPhone: input.secondaryPhone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    type: input.type,
    tags: input.tags,
    salespersonId: ctx.role.scope === 'OWN' ? existing.salespersonId : input.salespersonId,
    branchId: ctx.role.scope === 'ORGANIZATION' ? input.branchId : existing.branchId,
    paymentTerms: input.paymentTerms,
    creditLimit: input.creditLimit,
    taxId: input.taxId.trim(),
    activity
  };
  let next: ErpState = { ...state, customers: state.customers.map((c) => c.id === id ? updated : c) };
  if (changes.length || added.length || removed.length) {
    next = withAudit(next, ctx, {
      action: 'customer.updated',
      resource: 'Customer',
      resourceId: id,
      resourceLabel: updated.name,
      changes: [...changes, ...(added.length || removed.length ? [{ field: 'tags', from: existing.tags.join(', ') || '—', to: input.tags.join(', ') || '—' }] : [])]
    });
  }
  return { state: next, result: updated };
}

export function addCustomerNote(state: ErpState, id: string, body: string, ctx: DomainContext): DomainResult<Customer> {
  const existing = state.customers.find((c) => c.id === id);
  if (!existing) throw new DomainError('NOT_FOUND', 'This customer no longer exists.');
  if (!canAccessCustomer(existing, ctx.user, ctx.role)) throw new DomainError('FORBIDDEN', 'This customer is outside your access scope.');
  if (!body.trim()) throw new DomainError('VALIDATION', 'Write something before posting.');
  const mentioned = state.users.filter((u) => u.kind === 'person' && body.includes(`@${u.name.split(' ')[0]}`));
  const note = timelineEvent('note', body.trim(), ctx.user.id, ctx.now.toISOString(), mentioned.length ? { Mentions: mentioned.map((u) => u.name).join(', ') } : undefined);
  const updated: Customer = { ...existing, notes: [...existing.notes, note] };
  return { state: { ...state, customers: state.customers.map((c) => c.id === id ? updated : c) }, result: updated };
}