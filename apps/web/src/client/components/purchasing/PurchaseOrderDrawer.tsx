import React, { useEffect, useState } from 'react';
import { PackageCheckIcon, SendIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { PurchaseOrder, Supplier } from '../../types/purchasing';
import { formatDate } from '../../utils/dates';
import { formatMoney } from '../../utils/money';
import { isPoOverdue, poStatusMeta, poTotal } from '../../utils/purchasing';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

interface PurchaseOrderDrawerProps {
  po: PurchaseOrder | null;
  supplier: Supplier | undefined;
  onClose: () => void;
  onChange: (po: PurchaseOrder) => void;
}

export function PurchaseOrderDrawer({ po, supplier, onClose, onChange }: PurchaseOrderDrawerProps) {
  const { lookups, actions, can } = useErp();
  const [receiving, setReceiving] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setReceiving({}), [po?.id]);

  if (!po) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;

  const meta = poStatusMeta[po.status];
  const open = po.status === 'sent' || po.status === 'partial';
  const warehouse = lookups.warehousesById.get(po.warehouseId);
  const canReceive = can('inventory.adjust');
  const pending = po.lines.map((l) => ({ line: l, qty: Math.min(l.ordered - l.received, Math.max(0, parseInt(receiving[l.variantId] ?? '', 10) || 0)) }));
  const toReceive = pending.reduce((s, p) => s + p.qty, 0);

  const fillAll = () => setReceiving(Object.fromEntries(po.lines.map((l) => [l.variantId, String(l.ordered - l.received)])));

  const receive = () => {
    setSaving(true);
    let okUnits = 0;
    const lines = po.lines.map((l) => {
      const qty = pending.find((p) => p.line.variantId === l.variantId)?.qty ?? 0;
      if (qty <= 0) return l;
      const ok = actions.adjustStock({ variantId: l.variantId, warehouseId: po.warehouseId, kind: 'receive', quantity: qty, reason: 'Goods receipt', note: po.number });
      if (!ok) return l;
      okUnits += qty;
      return { ...l, received: l.received + qty };
    });
    setSaving(false);
    if (okUnits === 0) return;
    const complete = lines.every((l) => l.received >= l.ordered);
    onChange({ ...po, lines, status: complete ? 'received' : 'partial' });
    setReceiving({});
    toast.success(`Received ${okUnits} units into ${warehouse?.name}`, { description: 'Stock levels and the ledger were updated.' });
  };

  return (
    <Drawer
      open
      onClose={onClose}
      size="lg"
      title={po.number}
      description={`${supplier?.name ?? 'Supplier'} · deliver to ${warehouse?.name ?? '—'}`}
      dirty={toReceive > 0}
      footer={
      po.status === 'draft' ?
      <>
            <Button icon={XCircleIcon} onClick={() => {onChange({ ...po, status: 'cancelled' });toast(`${po.number} cancelled`);}}>
              Cancel PO
            </Button>
            <Button variant="primary" icon={SendIcon} onClick={() => {onChange({ ...po, status: 'sent' });toast.success(`${po.number} sent to ${supplier?.name}`);}}>
              Send to supplier
            </Button>
          </> :
      open && canReceive ?
      <>
            <Button onClick={fillAll}>Receive everything</Button>
            <Button variant="primary" icon={PackageCheckIcon} disabled={toReceive === 0} loading={saving} onClick={receive}>
              {toReceive > 0 ? `Receive ${toReceive} units` : 'Receive goods'}
            </Button>
          </> :
      undefined
      }>
      
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
        {isPoOverdue(po, Date.now()) && <Badge tone="critical">Overdue</Badge>}
      </div>
      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-4">
        <div>
          <dt className="text-muted">Created</dt>
          <dd className="mt-0.5 text-ink">{formatDate(po.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Expected</dt>
          <dd className="mt-0.5 text-ink">{formatDate(po.expectedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Terms</dt>
          <dd className="mt-0.5 text-ink">{supplier?.terms ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">Total</dt>
          <dd className="tabular mt-0.5 font-medium text-ink">{formatMoney(poTotal(po))}</dd>
        </div>
      </dl>
      {po.note && <p className="mb-5 rounded-md bg-surface-2 px-3 py-2 text-[13px] text-muted">{po.note}</p>}

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th className="py-2 text-left font-medium">Item</th>
            <th className="py-2 text-right font-medium">Unit cost</th>
            <th className="py-2 text-right font-medium">Received</th>
            {open && canReceive && <th className="w-24 py-2 pl-3 text-right font-medium">Receive now</th>}
          </tr>
        </thead>
        <tbody>
          {po.lines.map((l) => {
            const v = lookups.variantsById.get(l.variantId);
            const p = v ? lookups.productsById.get(v.productId) : undefined;
            const remaining = l.ordered - l.received;
            return (
              <tr key={l.variantId} className="border-b border-line last:border-0">
                <td className="py-2.5">
                  <div className="font-medium text-ink">{p?.name ?? 'Unknown item'}</div>
                  <div className="text-xs text-muted">{v?.sku}</div>
                </td>
                <td className="tabular py-2.5 text-right text-muted">{formatMoney(l.unitCost)}</td>
                <td className="tabular py-2.5 text-right">
                  <span className={l.received >= l.ordered ? 'text-positive' : 'text-ink'}>{l.received}</span>
                  <span className="text-subtle"> / {l.ordered}</span>
                </td>
                {open && canReceive &&
                <td className="py-2.5 pl-3">
                    <input
                    aria-label={`Units of ${p?.name} to receive`}
                    inputMode="numeric"
                    disabled={remaining === 0}
                    value={receiving[l.variantId] ?? ''}
                    onChange={(e) => setReceiving((r) => ({ ...r, [l.variantId]: e.target.value.replace(/\D/g, '') }))}
                    placeholder={remaining ? String(remaining) : '—'}
                    className="tabular h-8 w-full rounded-md border border-line-strong bg-surface px-2 text-right text-[13px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface-2" />
                  
                  </td>
                }
              </tr>);

          })}
        </tbody>
      </table>
      {open && !canReceive && <p className="mt-4 text-xs text-muted">Your role can't receive stock. Ask a warehouse lead or branch manager.</p>}
    </Drawer>);

}