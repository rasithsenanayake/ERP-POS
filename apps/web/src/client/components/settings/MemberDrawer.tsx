import React, { FormEvent, useEffect, useState } from 'react';
import { useErp } from '../../contexts/ErpContext';
import { assignableRoles } from '../../data/organization';
import type { RoleKey, User } from '../../types/org';
import { cn } from '../../utils/cn';
import type { MemberInput } from '../../utils/domain/settings';
import { scopeLabels } from '../../utils/permissions';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';

interface MemberDrawerProps {
  open: boolean;
  member?: User;
  onClose: () => void;
  onSubmit: (input: MemberInput) => Promise<boolean> | boolean;
}

export function MemberDrawer({ open, member, onClose, onSubmit }: MemberDrawerProps) {
  const { state } = useErp();
  const [form, setForm] = useState<MemberInput>({ name: '', email: '', title: '', role: 'salesperson', branchId: null });
  const [errors, setErrors] = useState<Partial<Record<keyof MemberInput, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(member ? { name: member.name, email: member.email, title: member.title, role: member.role, branchId: member.branchId } : { name: '', email: '', title: '', role: 'salesperson', branchId: state.branches[0]?.id ?? null });
    setErrors({});
  }, [open, member, state.branches]);

  const role = state.roles.find((r) => r.key === form.role);
  const needsBranch = role?.scope !== 'ORGANIZATION';

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (needsBranch && !form.branchId) next.branchId = 'Choose a branch.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const ok = await onSubmit({ ...form, branchId: needsBranch ? form.branchId : form.branchId || null });
    setSaving(false);
    if (ok) onClose();
  };

  const pickRole = (key: RoleKey) => setForm((f) => ({ ...f, role: key }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : 'Invite teammate'}
      description={member ? undefined : 'They sign in with this email and join your workspace automatically.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={() => void submit()}>
            {member ? 'Save changes' : 'Create invite'}
          </Button>
        </>
      }>
      
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="m-name" error={errors.name}>
            <input id="m-name" className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Job title" htmlFor="m-title" optional>
            <input id="m-title" className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={role?.name} />
          </Field>
        </div>
        <Field label="Email" htmlFor="m-email" error={errors.email}>
          <input id="m-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-ink">Role</legend>
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {assignableRoles.map((r) => {
              const def = state.roles.find((x) => x.key === r.key);
              const checked = form.role === r.key;
              return (
                <label key={r.key} className={cn('flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors duration-150', checked ? 'bg-accent-soft/50' : 'hover:bg-surface-2/60')}>
                  <input type="radio" name="role" className="mt-0.5 accent-[rgb(var(--accent))]" checked={checked} onChange={() => pickRole(r.key)} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">
                      {def?.name} <span className="font-normal text-subtle">· {def ? scopeLabels[def.scope] : ''}</span>
                    </span>
                    <span className="block text-xs text-muted">{r.description}</span>
                  </span>
                </label>);

            })}
          </div>
        </fieldset>

        <Field label="Branch" htmlFor="m-branch" error={errors.branchId} hint={needsBranch ? 'This role only sees data for this branch.' : 'Optional — used as their default location.'}>
          <select
            id="m-branch"
            className={selectClass}
            style={selectChevron}
            value={form.branchId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value || null }))}>
            
            {!needsBranch && <option value="">All branches</option>}
            {state.branches.map((b) =>
            <option key={b.id} value={b.id}>
                {b.name}
              </option>
            )}
          </select>
        </Field>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Drawer>);

}
