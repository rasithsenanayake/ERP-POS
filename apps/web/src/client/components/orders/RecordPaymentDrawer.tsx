import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { Order, PaymentMethod } from '../../types/sales';
import { centsToInput, formatMoney, parseMoneyInput } from '../../utils/money';
import { orderTotals } from '../../utils/orderMath';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface RecordPaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

const methods: {value: PaymentMethod;label: string;}[] = [
{ value: 'cash', label: 'Cash' },
{ value: 'card', label: 'Card' },
{ value: 'bank_transfer', label: 'Bank' },
{ value: 'qr', label: 'LankaQR' }];


export function RecordPaymentDrawer({ open, onClose, order }: RecordPaymentDrawerProps) {
  const { state, actions } = useErp();
  const totals = orderTotals(order, state.company.taxRateBps);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(centsToInput(totals.balance));
    setMethod(order.channel === 'wholesale' ? 'bank_transfer' : 'cash');
    setReference('');
    setTouched(false);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cents = parseMoneyInput(amount);
  const error = cents === null ? 'Enter an amount like 12500 or 12500.50' : cents <= 0 ? 'Amount must be more than zero' : cents > totals.balance ? `Can't exceed the outstanding ${formatMoney(totals.balance, { decimals: true })}` : undefined;

  const submit = () => {
    setTouched(true);
    if (error || cents === null || submitting) return;
    setSubmitting(true);
    const result = actions.recordPayment({ orderId: order.id, amount: cents, method, reference });
    setSubmitting(false);
    if (result) {
      toast.success(`${formatMoney(cents)} recorded on ${order.number}`);
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Record payment"
      description={`${order.number} · ${formatMoney(totals.balance, { decimals: true })} outstanding`}
      dirty={touched && amount !== centsToInput(totals.balance)}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={submitting} disabled={Boolean(error) && touched}>
            Record {cents && !error ? formatMoney(cents) : 'payment'}
          </Button>
        </>
      }>
      
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
        
        <Field label="Amount (Rs)" htmlFor="pay-amount" error={touched ? error : undefined} hint="Partial payments are allowed.">
          <input id="pay-amount" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => setTouched(true)} inputMode="decimal" className={`${inputClass} tabular h-9 text-base`} />
        </Field>
        <div>
          <span className="mb-1 block text-[13px] font-medium text-ink">Method</span>
          <SegmentedControl label="Payment method" value={method} onChange={setMethod} options={methods} className="w-full" />
        </div>
        <Field label="Reference" htmlFor="pay-ref" optional hint={method === 'bank_transfer' ? 'Bank slip or transfer reference' : method === 'card' ? 'Last 4 digits or approval code' : undefined}>
          <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
        </Field>
        <dl className="space-y-1 rounded-md bg-surface-2/70 px-3 py-2.5 text-[13px]">
          <div className="flex justify-between text-muted">
            <dt>Order total</dt>
            <dd className="tabular">{formatMoney(totals.total, { decimals: true })}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Paid so far</dt>
            <dd className="tabular">{formatMoney(totals.paid, { decimals: true })}</dd>
          </div>
          <div className="flex justify-between font-medium text-ink">
            <dt>Balance after this payment</dt>
            <dd className="tabular">{formatMoney(Math.max(0, totals.balance - (cents && !error ? cents : 0)), { decimals: true })}</dd>
          </div>
        </dl>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Drawer>);

}