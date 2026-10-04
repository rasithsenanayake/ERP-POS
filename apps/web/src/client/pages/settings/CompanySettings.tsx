import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { PencilIcon, PlusIcon, StoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BranchDrawer } from '../../components/settings/BranchDrawer';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useErp } from '../../contexts/ErpContext';
import type { Branch } from '../../types/org';
import { cn } from '../../utils/cn';
import { inputClass, textareaClass } from '../../utils/styles';

interface FormState {
  name: string;
  registrationNo: string;
  taxLabel: string;
  taxRate: string;
  phone: string;
  email: string;
  address: string;
  receiptFooter: string;
}

export function CompanySettings() {
  const { state, can, actions } = useErp();
  const canManage = can('settings.manage');
  const company = state.company;
  const initial = useMemo<FormState>(
    () => ({
      name: company.name,
      registrationNo: company.registrationNo,
      taxLabel: company.taxLabel,
      taxRate: String(company.taxRateBps / 100),
      phone: company.phone ?? '',
      email: company.email ?? '',
      address: company.address ?? '',
      receiptFooter: company.receiptFooter ?? ''
    }),
    [company]
  );
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [editing, setEditing] = useState<Branch | null | 'new'>(null);

  useEffect(() => setForm(initial), [initial]);
  const dirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== initial[k]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = 'Company name is required.';
    const rate = Number(form.taxRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 50) nextErrors.taxRate = 'Enter a rate between 0 and 50.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const saved = actions.updateCompany({
      name: form.name,
      registrationNo: form.registrationNo.trim(),
      taxLabel: form.taxLabel,
      taxRateBps: Math.round(rate * 100),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      receiptFooter: form.receiptFooter.trim()
    });
    if (saved) toast.success('Company details saved');
  };

  const warehouseCount = (branchId: string) => state.warehouses.filter((w) => w.branchId === branchId).length;
  const staffCount = (branchId: string) => state.users.filter((u) => u.branchId === branchId && u.active !== false && u.kind === 'person').length;

  return (
    <div>
      <PageHeader title="Company & branches" meta={canManage ? 'These details appear on receipts, invoices and purchase orders.' : 'Only owners can change company details.'} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Company details">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <fieldset disabled={!canManage} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal name" htmlFor="co-name" error={errors.name} className="sm:col-span-2">
                  <input id="co-name" className={inputClass} value={form.name} onChange={set('name')} />
                </Field>
                <Field label="Registration number" htmlFor="co-reg" optional>
                  <input id="co-reg" className={inputClass} value={form.registrationNo} onChange={set('registrationNo')} />
                </Field>
                <Field label="Currency" htmlFor="co-currency" hint="Set when the workspace was created.">
                  <input id="co-currency" className={inputClass} value={`${company.currency} · Sri Lankan rupee`} disabled readOnly />
                </Field>
                <Field label="Tax name" htmlFor="co-taxlabel">
                  <input id="co-taxlabel" className={inputClass} value={form.taxLabel} onChange={set('taxLabel')} />
                </Field>
                <Field label="Tax rate (%)" htmlFor="co-taxrate" error={errors.taxRate} hint="Prices include tax. The breakdown on every order uses this rate.">
                  <input id="co-taxrate" inputMode="decimal" className={cn(inputClass, 'tabular')} value={form.taxRate} onChange={set('taxRate')} />
                </Field>
                <Field label="Phone" htmlFor="co-phone" optional>
                  <input id="co-phone" className={inputClass} value={form.phone} onChange={set('phone')} />
                </Field>
                <Field label="Email" htmlFor="co-email" error={errors.email} optional>
                  <input id="co-email" type="email" className={inputClass} value={form.email} onChange={set('email')} />
                </Field>
                <Field label="Registered address" htmlFor="co-address" optional className="sm:col-span-2">
                  <input id="co-address" className={inputClass} value={form.address} onChange={set('address')} />
                </Field>
                <Field label="Receipt footer" htmlFor="co-footer" hint="Return policy, thank-you note or social handles." optional className="sm:col-span-2">
                  <textarea id="co-footer" rows={3} className={textareaClass} value={form.receiptFooter} onChange={set('receiptFooter')} placeholder="Exchanges within 7 days with receipt. Thank you for shopping with us!" />
                </Field>
              </div>
            </fieldset>
            {canManage &&
            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                {dirty &&
              <Button onClick={() => setForm(initial)} type="button">
                    Discard
                  </Button>
              }
                <Button type="submit" variant="primary" disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            }
          </form>
        </Panel>

        <Panel
          title="Branches"
          description={`${state.branches.length} locations`}
          flush
          actions={
          canManage &&
          <Button size="sm" icon={PlusIcon} onClick={() => setEditing('new')}>
                Add branch
              </Button>

          }>
          
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {state.branches.map((b) =>
            <li key={b.id} className="flex items-start gap-3 px-4 py-3">
                <StoreIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{b.name}</div>
                  <div className="truncate text-xs text-muted">{b.address || b.city || 'No address yet'}</div>
                  <div className="mt-1 text-xs text-subtle">
                    {staffCount(b.id)} staff · {warehouseCount(b.id)} stockroom
                  </div>
                </div>
                {canManage && <Button size="sm" variant="ghost" icon={PencilIcon} aria-label={`Edit ${b.name}`} onClick={() => setEditing(b)} />}
              </li>
            )}
          </ul>
        </Panel>
      </div>
      <BranchDrawer open={editing !== null} branch={editing && editing !== 'new' ? editing : undefined} onClose={() => setEditing(null)} />
    </div>);

}