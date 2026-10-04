import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import type { PurchaseOrder, Supplier } from '../../types/purchasing';
import { DAY } from '../../utils/dates';
import { createId } from '../../utils/ids';
import { formatMoney } from '../../utils/money';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';

interface NewPurchaseOrderDrawerProps {
  open: boolean;
  suppliers: Supplier[];
  nextNumber: string;
  onClose: () => void;
  onCreate: (po: PurchaseOrder) => void;
}

interface DraftLine {
  key: string;
  variantId: string;
  quantity: string;
}

export function NewPurchaseOrderDrawer({ open, suppliers, nextNumber, onClose, onCreate }: NewPurchaseOrderDrawerProps) {
  const { state, user, lookups, scoped } = useErp();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [warehouseId, setWarehouseId] = useState('wh-kel');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const supplier = suppliers.find((s) => s.id === supplierId);
  const variants = useMemo(
    () => state.variants.filter((v) => lookups.productsById.get(v.productId)?.supplier === supplier?.name),
    [state.variants, lookups.productsById, supplier]
  );

  useEffect(() => {
    if (!open) return;
    setLines([]);
    setNote('');
    setError('');
  }, [open]);

  useEffect(() => setLines([]), [supplierId]);

  const total = lines.reduce((sum, l) => sum + (lookups.variantsById.get(l.variantId)?.cost ?? 0) * (parseInt(l.quantity, 10) || 0), 0);

  const submit = (status: 'draft' | 'sent') => {
    const valid = lines.filter((l) => l.variantId && parseInt(l.quantity, 10) > 0);
    if (valid.length === 0) {
      setError('Add at least one item with a quantity.');
      return;
    }
    const now = new Date();
    onCreate({
      id: createId('po'),
      number: nextNumber,
      supplierId,
      warehouseId,
      status,
      createdAt: now.toISOString(),
      expectedAt: new Date(now.getTime() + (supplier?.leadTimeDays ?? 7) * DAY).toISOString(),
      createdBy: user.id,
      note: note.trim(),
      lines: valid.map((l) => ({ variantId: l.variantId, ordered: parseInt(l.quantity, 10), received: 0, unitCost: lookups.variantsById.get(l.variantId)?.cost ?? 0 }))
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      title="New purchase order"
      description={nextNumber}
      dirty={lines.length > 0}
      footer={
      <>
          <span className="tabular mr-auto text-[13px] text-muted">
            Total <span className="font-semibold text-ink">{formatMoney(total)}</span>
          </span>
          <Button onClick={() => submit('draft')}>Save draft</Button>
          <Button variant="primary" onClick={() => submit('sent')}>
            Send to supplier
          </Button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier" htmlFor="po-supplier" hint={supplier ? `${supplier.leadTimeDays}-day lead time · ${supplier.terms}` : undefined}>
          <select id="po-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={selectClass} style={selectChevron}>
            {suppliers.map((s) =>
            <option key={s.id} value={s.id}>
                {s.name}
              </option>
            )}
          </select>
        </Field>
        <Field label="Deliver to" htmlFor="po-warehouse">
          <select id="po-warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={selectClass} style={selectChevron}>
            {(scoped.warehouses.length ? scoped.warehouses : state.warehouses).map((w) =>
            <option key={w.id} value={w.id}>
                {w.name}
              </option>
            )}
          </select>
        </Field>
      </div>

      <h3 className="mb-2 mt-6 text-[13px] font-semibold text-ink">Items</h3>
      {lines.length === 0 && <p className="mb-3 text-[13px] text-muted">Only products supplied by {supplier?.name} can be added.</p>}
      <ul className="space-y-2">
        {lines.map((line) => {
          const v = lookups.variantsById.get(line.variantId);
          return (
            <li key={line.key} className="grid grid-cols-[1fr_80px_96px_32px] items-center gap-2">
              <select
                aria-label="Product"
                value={line.variantId}
                onChange={(e) => setLines((ls) => ls.map((l) => l.key === line.key ? { ...l, variantId: e.target.value } : l))}
                className={selectClass}
                style={selectChevron}>
                
                <option value="">Choose a product…</option>
                {variants.map((variant) =>
                <option key={variant.id} value={variant.id}>
                    {lookups.productsById.get(variant.productId)?.name} {variant.title !== 'Default' ? `· ${variant.title}` : ''}
                  </option>
                )}
              </select>
              <input
                aria-label="Quantity"
                inputMode="numeric"
                value={line.quantity}
                onChange={(e) => setLines((ls) => ls.map((l) => l.key === line.key ? { ...l, quantity: e.target.value.replace(/\D/g, '') } : l))}
                className={`${inputClass} tabular text-right`}
                placeholder="Qty" />
              
              <span className="tabular truncate text-right text-[13px] text-muted">{v ? formatMoney(v.cost * (parseInt(line.quantity, 10) || 0)) : '—'}</span>
              <Button size="sm" variant="ghost" icon={Trash2Icon} aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))} />
            </li>);

        })}
      </ul>
      <Button
        size="sm"
        icon={PlusIcon}
        className="mt-3"
        onClick={() => {
          setError('');
          setLines((ls) => [...ls, { key: createId('pl'), variantId: '', quantity: '' }]);
        }}>
        
        Add item
      </Button>
      {error &&
      <p className="mt-2 text-xs text-critical" role="alert">
          {error}
        </p>
      }

      <Field label="Note to supplier" htmlFor="po-note" optional className="mt-6">
        <input id="po-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Delivery instructions, reference…" />
      </Field>
    </Drawer>);

}