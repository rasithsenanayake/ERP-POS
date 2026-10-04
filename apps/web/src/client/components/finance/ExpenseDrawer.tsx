import React, { useEffect, useState } from 'react';
import { useErp } from '../../contexts/ErpContext';
import { expenseCategories } from '../../data/finance';
import type { Expense, ExpenseCategory } from '../../types/finance';
import { createId } from '../../utils/ids';
import { parseMoneyInput } from '../../utils/money';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';

interface ExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreate: (expense: Expense) => void;
}

const methods: {value: Expense['method'];label: string;}[] = [
{ value: 'bank_transfer', label: 'Bank transfer' },
{ value: 'card', label: 'Card' },
{ value: 'cash', label: 'Cash' },
{ value: 'cheque', label: 'Cheque' }];


export function ExpenseDrawer({ open, onClose, onCreate }: ExpenseDrawerProps) {
  const { state } = useErp();
  const today = new Date().toISOString().slice(0, 10);
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Utilities');
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<Expense['method']>('bank_transfer');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setVendor('');
    setAmount('');
    setReference('');
    setErrors({});
    setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseMoneyInput(amount);
    const next: Record<string, string> = {};
    if (!vendor.trim()) next.vendor = 'Who was this paid to?';
    if (!cents || cents <= 0) next.amount = 'Enter an amount, e.g. 12,500';
    setErrors(next);
    if (Object.keys(next).length) return;
    onCreate({ id: createId('exp'), vendor: vendor.trim(), amount: cents!, category, branchId: branchId || null, date, method, reference: reference.trim(), status: cents! >= 10_000_000 ? 'pending_approval' : 'paid' });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Record expense"
      description="Expenses of Rs 100,000 or more go to an owner for approval."
      dirty={!!vendor || !!amount}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="expense-form">
            Save expense
          </Button>
        </>
      }>
      
      <form id="expense-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Paid to" htmlFor="exp-vendor" error={errors.vendor} className="sm:col-span-2">
          <input id="exp-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} className={inputClass} placeholder="e.g. Ceylon Electricity Board" />
        </Field>
        <Field label="Amount (Rs)" htmlFor="exp-amount" error={errors.amount}>
          <input id="exp-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} tabular`} placeholder="0.00" />
        </Field>
        <Field label="Date" htmlFor="exp-date">
          <input id="exp-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Category" htmlFor="exp-category">
          <select id="exp-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={selectClass} style={selectChevron}>
            {expenseCategories.map((c) =>
            <option key={c}>{c}</option>
            )}
          </select>
        </Field>
        <Field label="Branch" htmlFor="exp-branch">
          <select id="exp-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} className={selectClass} style={selectChevron}>
            <option value="">Company-wide</option>
            {state.branches.map((b) =>
            <option key={b.id} value={b.id}>
                {b.name}
              </option>
            )}
          </select>
        </Field>
        <Field label="Paid by" htmlFor="exp-method">
          <select id="exp-method" value={method} onChange={(e) => setMethod(e.target.value as Expense['method'])} className={selectClass} style={selectChevron}>
            {methods.map((m) =>
            <option key={m.value} value={m.value}>
                {m.label}
              </option>
            )}
          </select>
        </Field>
        <Field label="Reference" htmlFor="exp-ref" optional>
          <input id="exp-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="Invoice or receipt no." />
        </Field>
      </form>
    </Drawer>);

}