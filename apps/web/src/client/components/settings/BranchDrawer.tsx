import React, { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { Branch } from '../../types/org';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';

interface BranchDrawerProps {
  open: boolean;
  branch?: Branch;
  onClose: () => void;
}

const empty = { name: '', shortName: '', city: '', address: '' };

export function BranchDrawer({ open, branch, onClose }: BranchDrawerProps) {
  const { actions } = useErp();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(branch ? { name: branch.name, shortName: branch.shortName, city: branch.city, address: branch.address } : empty);
    setError(null);
  }, [open, branch]);

  const dirty = branch ? form.name !== branch.name || form.shortName !== branch.shortName || form.city !== branch.city || form.address !== branch.address : Object.values(form).some(Boolean);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!form.name.trim()) return setError('Branch name is required.');
    const saved = actions.saveBranch({ id: branch?.id, ...form });
    if (!saved) return;
    toast.success(branch ? `${saved.name} updated` : `${saved.name} added`, { description: branch ? undefined : 'A stockroom was created for this branch.' });
    onClose();
  };

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={branch ? `Edit ${branch.shortName}` : 'Add branch'}
      description={branch ? undefined : 'Each branch gets its own stockroom, staff and sales numbers.'}
      dirty={dirty}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => submit()}>
            {branch ? 'Save changes' : 'Add branch'}
          </Button>
        </>
      }>
      
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Branch name" htmlFor="br-name" error={error ?? undefined}>
          <input id="br-name" className={inputClass} value={form.name} onChange={set('name')} placeholder="Negombo Beach Road" />
        </Field>
        <Field label="Short name" htmlFor="br-short" hint="Used in tables and the branch picker." optional>
          <input id="br-short" className={inputClass} value={form.shortName} onChange={set('shortName')} placeholder="Negombo" />
        </Field>
        <Field label="City" htmlFor="br-city" optional>
          <input id="br-city" className={inputClass} value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Address" htmlFor="br-address" hint="Printed on receipts from this branch." optional>
          <input id="br-address" className={inputClass} value={form.address} onChange={set('address')} />
        </Field>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Drawer>);

}