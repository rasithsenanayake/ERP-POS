import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import { customerTagOptions } from '../../data/customers';
import type { Customer, PaymentTerms } from '../../types/sales';
import { cn } from '../../utils/cn';
import { centsToInput, parseMoneyInput } from '../../utils/money';
import { termsLabel } from '../../utils/orderMath';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface CustomerFormDrawerProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}

interface FormState {
  name: string;
  type: 'individual' | 'business';
  company: string;
  taxId: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  branchId: string;
  salespersonId: string;
  paymentTerms: PaymentTerms;
  creditLimit: string;
  tags: string[];
}

const phonePattern = /^(\+94\s?|0)\d{2}\s?\d{3}\s?\d{4}$/;

const schema = z.
object({
  name: z.string().trim().min(2, 'Enter the customer’s full name'),
  type: z.enum(['individual', 'business']),
  company: z.string().trim(),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
  phone: z.string().trim().regex(phonePattern, 'Use a Sri Lankan number, e.g. 077 123 4567'),
  secondaryPhone: z.union([z.literal(''), z.string().trim().regex(phonePattern, 'Use a Sri Lankan number')]),
  creditLimit: z.string().refine((v) => v.trim() === '' || parseMoneyInput(v) !== null, 'Enter an amount like 250000')
}).
refine((v) => v.type === 'individual' || v.company.length > 1, { message: 'Business customers need a company name', path: ['company'] });

export function CustomerFormDrawer({ open, onClose, customer }: CustomerFormDrawerProps) {
  const { state, actions, user, role, branchId } = useErp();
  const navigate = useNavigate();

  const initial = useMemo<FormState>(
    () => ({
      name: customer?.name ?? '',
      type: customer?.type ?? 'individual',
      company: customer?.company ?? '',
      taxId: customer?.taxId ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      secondaryPhone: customer?.secondaryPhone ?? '',
      address: customer?.address ?? '',
      city: customer?.city ?? '',
      branchId: customer?.branchId ?? branchId ?? user.branchId ?? state.branches[0].id,
      salespersonId: customer?.salespersonId ?? (role.scope === 'ORGANIZATION' ? '' : user.id),
      paymentTerms: customer?.paymentTerms ?? 'due_on_receipt',
      creditLimit: customer ? centsToInput(customer.creditLimit) : '',
      tags: customer?.tags ?? ['Retail']
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customer, open]
  );

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
      setSubmitting(false);
    }
  }, [open, initial]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const staff = state.users.filter((u) => u.kind === 'person' && (u.branchId === form.branchId || u.role === 'owner'));
  const salespersonValue = form.salespersonId || staff.find((u) => u.role === 'salesperson')?.id || user.id;

  const submit = () => {
    if (submitting) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const input = {
      name: form.name,
      type: form.type,
      company: form.type === 'business' ? form.company : '',
      email: form.email,
      phone: form.phone,
      secondaryPhone: form.secondaryPhone,
      address: form.address,
      city: form.city,
      tags: form.tags,
      salespersonId: salespersonValue,
      branchId: form.branchId,
      paymentTerms: form.paymentTerms,
      creditLimit: parseMoneyInput(form.creditLimit) ?? 0,
      taxId: form.type === 'business' ? form.taxId : ''
    };
    const result = customer ? actions.updateCustomer(customer.id, input) : actions.createCustomer(input);
    setSubmitting(false);
    if (result) {
      toast.success(customer ? 'Customer saved' : `${result.name} added as ${result.number}`);
      onClose();
      if (!customer) navigate(`/customers/${result.id}`);
    }
  };

  const sectionTitle = 'mb-3 text-sm font-semibold text-ink';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customer ? `Edit ${customer.name}` : 'New customer'}
      size="lg"
      dirty={dirty}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={submitting} disabled={customer ? !dirty : false}>
            {customer ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }>
      
      <form
        className="space-y-7"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
        
        <section>
          <h3 className={sectionTitle}>Basic information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="c-name" error={errors.name}>
              <input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} autoComplete="off" />
            </Field>
            <div>
              <span className="mb-1 block text-[13px] font-medium text-ink">Customer type</span>
              <SegmentedControl
                label="Customer type"
                value={form.type}
                onChange={(v) => set('type', v)}
                className="w-full"
                options={[
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' }]
                } />
              
            </div>
            {form.type === 'business' &&
            <>
                <Field label="Company" htmlFor="c-company" error={errors.company}>
                  <input id="c-company" value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} />
                </Field>
                <Field label="VAT / TIN" htmlFor="c-tax" optional>
                  <input id="c-tax" value={form.taxId} onChange={(e) => set('taxId', e.target.value)} className={inputClass} />
                </Field>
              </>
            }
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile" htmlFor="c-phone" error={errors.phone}>
              <input id="c-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="077 123 4567" inputMode="tel" />
            </Field>
            <Field label="Email" htmlFor="c-email" optional error={errors.email}>
              <input id="c-email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} inputMode="email" />
            </Field>
            <Field label="Secondary phone" htmlFor="c-phone2" optional error={errors.secondaryPhone}>
              <input id="c-phone2" value={form.secondaryPhone} onChange={(e) => set('secondaryPhone', e.target.value)} className={inputClass} inputMode="tel" />
            </Field>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Address</h3>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Street address" htmlFor="c-address" optional>
              <input id="c-address" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
            </Field>
            <Field label="City" htmlFor="c-city" optional>
              <input id="c-city" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Account settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home branch" htmlFor="c-branch" hint={role.scope !== 'ORGANIZATION' ? 'Set by your role' : undefined}>
              <select id="c-branch" value={form.branchId} onChange={(e) => set('branchId', e.target.value)} disabled={role.scope !== 'ORGANIZATION'} className={selectClass} style={selectChevron}>
                {state.branches.map((b) =>
                <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                )}
              </select>
            </Field>
            <Field label="Salesperson" htmlFor="c-sales" hint={role.scope === 'OWN' ? 'Assigned to you' : undefined}>
              <select id="c-sales" value={salespersonValue} onChange={(e) => set('salespersonId', e.target.value)} disabled={role.scope === 'OWN'} className={selectClass} style={selectChevron}>
                {staff.map((u) =>
                <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                )}
              </select>
            </Field>
            <Field label="Payment terms" htmlFor="c-terms">
              <select id="c-terms" value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value as PaymentTerms)} className={selectClass} style={selectChevron}>
                {(Object.keys(termsLabel) as PaymentTerms[]).map((t) =>
                <option key={t} value={t}>
                    {termsLabel[t]}
                  </option>
                )}
              </select>
            </Field>
            <Field label="Credit limit (Rs)" htmlFor="c-credit" optional error={errors.creditLimit} hint="Leave empty for no credit">
              <input id="c-credit" value={form.creditLimit} onChange={(e) => set('creditLimit', e.target.value)} className={inputClass} inputMode="decimal" />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Tags</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Customer tags">
                {customerTagOptions.map((tag) => {
                  const on = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('tags', on ? form.tags.filter((t) => t !== tag) : [...form.tags, tag])}
                      className={cn(
                        'h-7 rounded-full border px-3 text-[13px] transition-colors duration-150',
                        on ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-line-strong text-muted hover:bg-surface-2 hover:text-ink'
                      )}>
                      
                      {tag}
                    </button>);

                })}
              </div>
            </div>
          </div>
        </section>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Drawer>);

}