import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { SalesChannel } from '../../types/sales';
import { cn } from '../../utils/cn';
import { variantAvailable } from '../../utils/inventory';
import { formatMoney, parseMoneyInput } from '../../utils/money';
import { inputClass, selectChevron, selectClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { CustomerPicker } from '../ui/CustomerPicker';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { VariantPicker } from '../ui/VariantPicker';

interface NewOrderDrawerProps {
  open: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}

const channels: {value: SalesChannel;label: string;}[] = [
{ value: 'in_store', label: 'In store' },
{ value: 'phone', label: 'Phone' },
{ value: 'online', label: 'Online' },
{ value: 'wholesale', label: 'Wholesale' }];


export function NewOrderDrawer({ open, onClose, initialCustomerId }: NewOrderDrawerProps) {
  const { state, lookups, actions, user, role, branchId } = useErp();
  const navigate = useNavigate();
  const defaultBranch = branchId ?? user.branchId ?? state.branches[0].id;
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [branch, setBranch] = useState(defaultBranch);
  const [channel, setChannel] = useState<SalesChannel>('in_store');
  const [lines, setLines] = useState<{variantId: string;quantity: number;}[]>([]);
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustomerId(initialCustomerId ?? null);
    setBranch(defaultBranch);
    setChannel(initialCustomerId && lookups.customersById.get(initialCustomerId)?.tags.includes('Wholesale') ? 'wholesale' : 'in_store');
    setLines([]);
    setDiscount('');
    setNote('');
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const warehouseId = state.branches.find((b) => b.id === branch)?.warehouseId ?? '';

  const rows = useMemo(
    () =>
    lines.map((line) => {
      const variant = lookups.variantsById.get(line.variantId)!;
      const product = lookups.productsById.get(variant.productId)!;
      const unitPrice = channel === 'wholesale' && variant.wholesalePrice ? variant.wholesalePrice : variant.price;
      const available = variantAvailable(variant, product, state.balances, [warehouseId]);
      return { ...line, variant, product, unitPrice, available, short: available !== null && line.quantity > available };
    }),
    [lines, lookups, channel, state.balances, warehouseId]
  );

  const subtotal = rows.reduce((s, r) => s + r.unitPrice * r.quantity, 0);
  const discountCents = discount.trim() ? parseMoneyInput(discount) : 0;
  const discountError = discountCents === null ? 'Enter an amount like 2500' : discountCents > subtotal ? 'Discount is more than the subtotal' : undefined;
  const total = Math.max(0, subtotal - (discountCents ?? 0));
  const vat = total - Math.round(total * 10000 / (10000 + state.company.taxRateBps));
  const anyShort = rows.some((r) => r.short);
  const dirty = lines.length > 0 || Boolean(note.trim()) || customerId !== null && customerId !== (initialCustomerId ?? null);

  const addLine = (variantId: string) => {
    setLines((prev) => prev.some((l) => l.variantId === variantId) ? prev.map((l) => l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l) : [...prev, { variantId, quantity: 1 }]);
  };
  const setQty = (variantId: string, quantity: number) => setLines((prev) => prev.map((l) => l.variantId === variantId ? { ...l, quantity: Math.max(1, quantity) } : l));

  const submit = (confirm: boolean) => {
    if (submitting || discountError) return;
    setSubmitting(true);
    const order = actions.createOrder({ customerId, branchId: branch, channel, lines, orderDiscount: discountCents ?? 0, customerNote: note, confirm });
    setSubmitting(false);
    if (order) {
      toast.success(confirm ? `${order.number} created and stock reserved` : `Draft ${order.number} saved`);
      onClose();
      navigate(`/orders/${order.id}`);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New order"
      description="Confirming reserves stock at the branch stockroom right away."
      size="lg"
      dirty={dirty}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit(false)} disabled={lines.length === 0 || Boolean(discountError)} loading={submitting}>
            Save as draft
          </Button>
          <Button variant="primary" onClick={() => submit(true)} disabled={lines.length === 0 || anyShort || Boolean(discountError)} loading={submitting}>
            Create order
          </Button>
        </>
      }>
      
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="order-customer" className="sm:col-span-2" hint="Leave empty for a walk-in sale.">
            <CustomerPicker id="order-customer" value={customerId} onChange={setCustomerId} />
          </Field>
          <Field label="Branch" htmlFor="order-branch" hint={role.scope === 'BRANCH' ? 'Locked to your branch' : undefined}>
            <select id="order-branch" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={role.scope === 'BRANCH'} className={selectClass} style={selectChevron}>
              {state.branches.map((b) =>
              <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              )}
            </select>
          </Field>
          <Field label="Channel" htmlFor="order-channel" hint={channel === 'wholesale' ? 'Wholesale prices apply where set.' : undefined}>
            <select id="order-channel" value={channel} onChange={(e) => setChannel(e.target.value as SalesChannel)} className={selectClass} style={selectChevron}>
              {channels.map((c) =>
              <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              )}
            </select>
          </Field>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">Items</h3>
          <VariantPicker id="order-product" onSelect={addLine} warehouseId={warehouseId} />
          {rows.length > 0 ?
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
              {rows.map((row) =>
            <li key={row.variantId} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{row.product.name}</div>
                    <div className="truncate text-xs text-muted">
                      {row.variant.title !== 'Default' ? `${row.variant.title} · ` : ''}
                      {row.variant.sku} ·{' '}
                      <span className={cn(row.short && 'font-medium text-critical')}>
                        {row.available === null ? 'Service' : row.short ? `Only ${row.available} available` : `${row.available} available`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center rounded-md border border-line-strong">
                    <button type="button" onClick={() => setQty(row.variantId, row.quantity - 1)} aria-label="Decrease quantity" className="flex h-7 w-7 items-center justify-center text-muted hover:text-ink">
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <input
                  aria-label={`Quantity of ${row.product.name}`}
                  value={row.quantity}
                  inputMode="numeric"
                  onChange={(e) => setQty(row.variantId, parseInt(e.target.value.replace(/\D/g, '') || '1', 10))}
                  className="tabular h-7 w-10 border-x border-line-strong bg-surface text-center text-[13px] focus:outline-none" />
                
                    <button type="button" onClick={() => setQty(row.variantId, row.quantity + 1)} aria-label="Increase quantity" className="flex h-7 w-7 items-center justify-center text-muted hover:text-ink">
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="tabular w-28 text-right text-[13px] text-ink">{formatMoney(row.unitPrice * row.quantity)}</div>
                  <button type="button" onClick={() => setLines((prev) => prev.filter((l) => l.variantId !== row.variantId))} aria-label={`Remove ${row.product.name}`} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-critical">
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </li>
            )}
            </ul> :

          <p className="mt-3 rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-[13px] text-muted">Search for a product or scan a barcode to add it.</p>
          }
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Order discount (Rs)" htmlFor="order-discount" optional error={discountError}>
            <input id="order-discount" value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
          </Field>
          <dl className="space-y-1 self-end rounded-md bg-surface-2/70 px-3 py-2.5 text-[13px]">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd className="tabular">{formatMoney(subtotal, { decimals: true })}</dd>
            </div>
            <div className="flex justify-between font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular">{formatMoney(total, { decimals: true })}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <dt>Includes VAT 18%</dt>
              <dd className="tabular">{formatMoney(vat, { decimals: true })}</dd>
            </div>
          </dl>
          <Field label="Customer note" htmlFor="order-note" optional className="sm:col-span-2">
            <textarea id="order-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} placeholder="Shown on the order and receipt" />
          </Field>
        </section>
      </div>
    </Drawer>);

}