import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import { cn } from '../../utils/cn';
import { availableQty, getBalance } from '../../utils/inventory';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { VariantPicker } from '../ui/VariantPicker';

interface TransferFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function TransferFormDrawer({ open, onClose }: TransferFormDrawerProps) {
  const { state, lookups, actions, role, user } = useErp();
  const own = state.warehouses.find((w) => w.branchId === user.branchId);
  const [from, setFrom] = useState('wh-kel');
  const [to, setTo] = useState('');
  const [lines, setLines] = useState<{variantId: string;quantity: number;}[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFrom('wh-kel');
    setTo(role.scope === 'BRANCH' && own ? own.id : 'wh-col');
    setLines([]);
    setNote('');
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = useMemo(
    () =>
    lines.map((l) => {
      const variant = lookups.variantsById.get(l.variantId)!;
      const product = lookups.productsById.get(variant.productId)!;
      const available = availableQty(getBalance(state.balances, l.variantId, from));
      return { ...l, variant, product, available, short: l.quantity > available };
    }),
    [lines, lookups, state.balances, from]
  );

  const scopeError =
  role.scope === 'BRANCH' && own && from !== own.id && to !== own.id ? 'One side of the transfer must be your branch.' : from === to ? 'Source and destination must differ.' : undefined;
  const invalid = rows.length === 0 || rows.some((r) => r.short || r.quantity < 1) || Boolean(scopeError);

  const submit = (submitRequest: boolean) => {
    if (invalid || submitting) return;
    setSubmitting(true);
    const ok = actions.createTransfer({ fromWarehouseId: from, toWarehouseId: to, lines, note, submit: submitRequest });
    setSubmitting(false);
    if (ok) {
      toast.success(submitRequest ? 'Transfer requested — awaiting approval' : 'Transfer saved as draft');
      onClose();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New stock transfer"
      description="Stock leaves the source when the transfer is dispatched, and arrives when it's received."
      size="lg"
      dirty={lines.length > 0 || Boolean(note)}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit(false)} disabled={invalid} loading={submitting}>
            Save draft
          </Button>
          <Button variant="primary" onClick={() => submit(true)} disabled={invalid} loading={submitting}>
            Submit request
          </Button>
        </>
      }>
      
      <div className="space-y-6">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Field label="From" htmlFor="trf-from">
            <select id="trf-from" value={from} onChange={(e) => setFrom(e.target.value)} className={selectClass} style={selectChevron}>
              {state.warehouses.map((w) =>
              <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              )}
            </select>
          </Field>
          <ArrowRightIcon className="mb-2 hidden h-4 w-4 text-subtle sm:block" aria-hidden />
          <Field label="To" htmlFor="trf-to">
            <select id="trf-to" value={to} onChange={(e) => setTo(e.target.value)} className={selectClass} style={selectChevron}>
              {state.warehouses.map((w) =>
              <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              )}
            </select>
          </Field>
        </div>
        {scopeError && <p className="text-[13px] text-critical">{scopeError}</p>}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">Products</h3>
          <VariantPicker
            id="trf-product"
            physicalOnly
            warehouseId={from}
            exclude={lines.map((l) => l.variantId)}
            onSelect={(variantId) => setLines((prev) => [...prev, { variantId, quantity: 1 }])} />
          
          {rows.length > 0 ?
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
              {rows.map((row) =>
            <li key={row.variantId} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{row.product.name}</div>
                    <div className={cn('truncate text-xs', row.short ? 'font-medium text-critical' : 'text-muted')}>
                      {row.variant.sku} · {row.available} available at source
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`trf-qty-${row.variantId}`}>
                    Quantity
                  </label>
                  <input
                id={`trf-qty-${row.variantId}`}
                value={row.quantity}
                inputMode="numeric"
                onChange={(e) => {
                  const q = parseInt(e.target.value.replace(/\D/g, '') || '0', 10);
                  setLines((prev) => prev.map((l) => l.variantId === row.variantId ? { ...l, quantity: q } : l));
                }}
                className={cn(inputClass, 'tabular w-20 text-right')} />
              
                  <button type="button" onClick={() => setLines((prev) => prev.filter((l) => l.variantId !== row.variantId))} aria-label={`Remove ${row.product.name}`} className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-critical">
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </li>
            )}
            </ul> :

          <p className="mt-3 rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-[13px] text-muted">Add the products to move.</p>
          }
        </section>
        <Field label="Note" htmlFor="trf-note" optional>
          <input id="trf-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Why is this stock moving?" />
        </Field>
      </div>
    </Drawer>);

}