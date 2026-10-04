import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { Order, PaymentMethod } from '../../types/sales';
import { centsToInput, formatMoney, parseMoneyInput } from '../../utils/money';
import { orderTotals } from '../../utils/orderMath';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface RefundDrawerProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

const reasons = ['Customer return', 'Defective item', 'Price adjustment', 'Cancelled after payment', 'Goodwill gesture'];

export function RefundDrawer({ open, onClose, order }: RefundDrawerProps) {
  const { state, actions, lookups } = useErp();
  const totals = orderTotals(order, state.company.taxRateBps);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reason, setReason] = useState(reasons[0]);
  const [restock, setRestock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(centsToInput(totals.netPaid));
    const lastMethod = order.payments.filter((p) => p.kind === 'payment').slice(-1)[0]?.method;
    setMethod(lastMethod ?? 'cash');
    setReason(order.status === 'fulfilled' ? reasons[0] : reasons[3]);
    setRestock(true);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cents = parseMoneyInput(amount);
  const error = cents === null ? 'Enter a valid amount' : cents <= 0 ? 'Amount must be more than zero' : cents > totals.netPaid ? `You can't refund more than the ${formatMoney(totals.netPaid, { decimals: true })} paid` : undefined;
  const full = cents === totals.netPaid;
  const canRestock = full && order.status === 'fulfilled';
  const warehouse = lookups.warehousesById.get(order.warehouseId);

  const consequence = !full ?
  'This is a partial refund. The order stays open and the payment status becomes partially refunded.' :
  order.status === 'fulfilled' ?
  restock ?
  `The order will be marked returned and ${totals.units} unit${totals.units > 1 ? 's' : ''} go back into ${warehouse?.name} through the stock ledger.` :
  'The order will be marked refunded. Items are not restocked.' :
  'The order will be closed as refunded and any reserved stock released.';

  const submit = () => {
    if (error || cents === null || submitting) return;
    setSubmitting(true);
    const result = actions.refundOrder({ orderId: order.id, amount: cents, method, reason, restock: canRestock && restock });
    setSubmitting(false);
    if (result) {
      toast.success(`Refunded ${formatMoney(cents)} on ${order.number}`);
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Issue refund"
      description={`${order.number} · ${formatMoney(totals.netPaid, { decimals: true })} refundable`}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={submit} disabled={Boolean(error)} loading={submitting}>
            Refund {cents && !error ? formatMoney(cents) : ''}
          </Button>
        </>
      }>
      
      <div className="space-y-5">
        <Field label="Refund amount (Rs)" htmlFor="refund-amount" error={error}>
          <input id="refund-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`${inputClass} tabular h-9 text-base`} />
        </Field>
        <div>
          <span className="mb-1 block text-[13px] font-medium text-ink">Refund to</span>
          <SegmentedControl
            label="Refund method"
            value={method}
            onChange={setMethod}
            className="w-full"
            options={[
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card' },
            { value: 'bank_transfer', label: 'Bank' },
            { value: 'qr', label: 'LankaQR' }]
            } />
          
        </div>
        <Field label="Reason" htmlFor="refund-reason">
          <select id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={selectClass} style={selectChevron}>
            {reasons.map((r) =>
            <option key={r}>{r}</option>
            )}
          </select>
        </Field>
        {canRestock &&
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line px-3 py-2.5">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
            <span>
              <span className="block text-[13px] font-medium text-ink">Return items to stock</span>
              <span className="block text-xs text-muted">Only if items came back unopened and sellable.</span>
            </span>
          </label>
        }
        <p className="rounded-md bg-warning-soft px-3 py-2.5 text-[13px] text-warning">{consequence}</p>
      </div>
    </Drawer>);

}