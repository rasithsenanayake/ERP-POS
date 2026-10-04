import React, { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { AdjustmentKind } from '../../types/inventory';
import { cn } from '../../utils/cn';
import { availableQty, getBalance } from '../../utils/inventory';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';
import { VariantPicker } from '../ui/VariantPicker';

interface StockAdjustmentDrawerProps {
  open: boolean;
  onClose: () => void;
  initialVariantId?: string;
  initialWarehouseId?: string;
}

const reasons: Record<AdjustmentKind, string[]> = {
  receive: ['Supplier delivery', 'Found during count', 'Customer return without order'],
  issue: ['Internal use', 'Display unit', 'Sample given'],
  adjustment: ['Cycle count', 'Full stock take', 'Data correction'],
  write_off: ['Damaged', 'Expired', 'Lost or stolen']
};

export function StockAdjustmentDrawer({ open, onClose, initialVariantId, initialWarehouseId }: StockAdjustmentDrawerProps) {
  const { state, lookups, actions, scoped, role, user } = useErp();
  const locations = role.scope === 'BRANCH' ? state.warehouses.filter((w) => w.branchId === user.branchId) : scoped.warehouses;
  const [variantId, setVariantId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [kind, setKind] = useState<AdjustmentKind>('receive');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(reasons.receive[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVariantId(initialVariantId ?? null);
    setWarehouseId(initialWarehouseId && locations.some((l) => l.id === initialWarehouseId) ? initialWarehouseId : locations[0]?.id ?? '');
    setKind('receive');
    setQuantity('');
    setReason(reasons.receive[0]);
    setNote('');
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const variant = variantId ? lookups.variantsById.get(variantId) : undefined;
  const product = variant ? lookups.productsById.get(variant.productId) : undefined;
  const balance = variant && warehouseId ? getBalance(state.balances, variant.id, warehouseId) : null;
  const qty = /^\d+$/.test(quantity) ? parseInt(quantity, 10) : null;
  const change = balance && qty !== null ? kind === 'receive' ? qty : kind === 'adjustment' ? qty - balance.onHand : -qty : 0;
  const after = balance ? balance.onHand + change : 0;
  const belowReserved = balance ? after < balance.reserved : false;
  const qtyError = quantity && qty === null ? 'Whole numbers only' : belowReserved ? `Leaves fewer than the ${balance?.reserved} reserved for open orders` : undefined;
  const large = balance && Math.abs(change) >= Math.max(20, balance.onHand * 0.5);
  const dirty = Boolean(variantId && variantId !== initialVariantId) || Boolean(quantity) || Boolean(note);

  const submit = () => {
    if (!variant || !warehouseId || qty === null || qtyError || submitting) return;
    setSubmitting(true);
    const ok = actions.adjustStock({ variantId: variant.id, warehouseId, kind, quantity: qty, reason, note });
    setSubmitting(false);
    if (ok) {
      toast.success(`Stock updated · ${product?.name}`, { description: `${balance?.onHand} → ${after} at ${lookups.warehousesById.get(warehouseId)?.name}` });
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Adjust stock"
      description="Every adjustment is written to the stock ledger with your name and reason."
      dirty={dirty}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={submitting} disabled={!variant || qty === null || Boolean(qtyError) || change === 0}>
            Save adjustment
          </Button>
        </>
      }>
      
      <div className="space-y-5">
        <Field label="Product" htmlFor="adj-product">
          {variant && product ?
          <div className="flex items-center gap-3 rounded-md border border-line-strong px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{product.name}</div>
                <div className="truncate text-xs text-muted">
                  {variant.title !== 'Default' ? `${variant.title} · ` : ''}
                  {variant.sku}
                </div>
              </div>
              <button type="button" onClick={() => setVariantId(null)} aria-label="Change product" className="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink">
                <XIcon className="h-4 w-4" />
              </button>
            </div> :

          <VariantPicker id="adj-product" onSelect={setVariantId} physicalOnly warehouseId={warehouseId || null} />
          }
        </Field>
        <Field label="Location" htmlFor="adj-location">
          <select id="adj-location" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectClass} style={selectChevron}>
            {locations.map((w) =>
            <option key={w.id} value={w.id}>
                {w.name}
              </option>
            )}
          </select>
        </Field>
        <div>
          <span className="mb-1 block text-[13px] font-medium text-ink">Movement</span>
          <SegmentedControl
            label="Movement type"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setReason(reasons[k][0]);
            }}
            className="w-full"
            options={[
            { value: 'receive', label: 'Receive' },
            { value: 'issue', label: 'Issue' },
            { value: 'adjustment', label: 'Count' },
            { value: 'write_off', label: 'Write-off' }]
            } />
          
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={kind === 'adjustment' ? 'Counted quantity' : 'Units'} htmlFor="adj-qty" error={qtyError}>
            <input id="adj-qty" value={quantity} onChange={(e) => setQuantity(e.target.value.trim())} inputMode="numeric" className={`${inputClass} tabular`} />
          </Field>
          <Field label="Reason" htmlFor="adj-reason">
            <select id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={selectClass} style={selectChevron}>
              {reasons[kind].map((r) =>
              <option key={r}>{r}</option>
              )}
            </select>
          </Field>
          <Field label="Note" htmlFor="adj-note" optional className="sm:col-span-2">
            <input id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. invoice number or what happened" />
          </Field>
        </div>
        {balance &&
        <dl className="grid grid-cols-3 divide-x divide-line rounded-md border border-line text-center">
            <div className="px-2 py-2.5">
              <dt className="text-xs text-muted">On hand now</dt>
              <dd className="tabular mt-0.5 text-base font-semibold text-ink">{balance.onHand}</dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-xs text-muted">Change</dt>
              <dd className={cn('tabular mt-0.5 text-base font-semibold', change > 0 ? 'text-positive' : change < 0 ? 'text-critical' : 'text-muted')}>
                {change > 0 ? `+${change}` : change}
              </dd>
            </div>
            <div className="px-2 py-2.5">
              <dt className="text-xs text-muted">After</dt>
              <dd className="tabular mt-0.5 text-base font-semibold text-ink">{after}</dd>
            </div>
          </dl>
        }
        {balance && <p className="text-xs text-muted">{balance.reserved} reserved for open orders · {availableQty(balance)} available</p>}
        {large && !qtyError && <p className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">This is a large change. Double-check the count before saving — it will be visible in the activity log.</p>}
      </div>
    </Drawer>);

}