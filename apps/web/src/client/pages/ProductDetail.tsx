import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SearchXIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { useRecordRecent } from '../hooks/useRecordRecent';
import { cn } from '../utils/cn';
import { formatDate, formatShort } from '../utils/dates';
import { availableQty, bundleAvailable, getBalance, movementLabels } from '../utils/inventory';
import { formatMoney } from '../utils/money';

export function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { state, lookups, can, scoped } = useErp();
  const { openDrawer } = useUi();
  const product = state.products.find((p) => p.id === productId);
  const variants = useMemo(() => state.variants.filter((v) => v.productId === productId), [state.variants, productId]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const canCost = can('products.view_cost');

  useRecordRecent(product ? { type: 'product', id: product.id, label: product.name, sublabel: variants[0]?.sku ?? '', href: `/products/${product.id}` } : null);

  const movements = useMemo(
    () => product ? state.ledger.filter((e) => e.productId === product.id && scoped.warehouses.some((w) => w.id === e.warehouseId)).slice(-8).reverse() : [],
    [state.ledger, product, scoped.warehouses]
  );

  if (!product) {
    return <ErrorState icon={SearchXIcon} title="Product not found" description="It may have been archived or the link is wrong." actions={<Button onClick={() => navigate('/products')}>Back to products</Button>} />;
  }

  const activeVariant = variants.find((v) => v.id === variantId) ?? variants[0];
  const warehouses = scoped.warehouses;
  const physical = product.type === 'physical';
  const totalAvailable = physical ?
  variants.reduce((s, v) => s + warehouses.reduce((t, w) => t + availableQty(getBalance(state.balances, v.id, w.id)), 0), 0) :
  product.type === 'bundle' ?
  bundleAvailable(product, state.balances, warehouses.map((w) => w.id)) :
  null;
  const onHandValue = physical ? variants.reduce((s, v) => s + warehouses.reduce((t, w) => t + getBalance(state.balances, v.id, w.id).onHand, 0) * v.cost, 0) : 0;

  return (
    <div>
      <PageHeader
        title={product.name}
        backTo={{ to: '/products', label: 'products' }}
        badges={<StatusBadge kind="product" status={product.status} />}
        meta={`${product.category} · ${product.brand} · ${product.type === 'bundle' ? 'Bundle' : product.type === 'service' ? 'Service' : `${variants.length} variant${variants.length > 1 ? 's' : ''}`}`}
        actions={
        physical &&
        can('inventory.adjust') &&
        <Button icon={SlidersHorizontalIcon} onClick={() => openDrawer('adjust', { variantId: activeVariant.id })}>
              Adjust stock
            </Button>

        } />
      

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <Panel title="Variants & pricing" description="Prices include VAT." flush>
            <div className="overflow-x-auto">
              <table className="mt-3 w-full text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-surface-2/50 text-xs text-muted">
                    <th scope="col" className="h-8 px-4 text-left font-medium">Variant</th>
                    <th scope="col" className="h-8 px-3 text-left font-medium">SKU / Barcode</th>
                    <th scope="col" className="h-8 px-3 text-right font-medium">Retail</th>
                    <th scope="col" className="h-8 px-3 text-right font-medium">Wholesale</th>
                    <th scope="col" className="h-8 px-3 text-right font-medium">Compare-at</th>
                    {canCost && <th scope="col" className="h-8 px-3 text-right font-medium">Cost</th>}
                    {canCost && <th scope="col" className="h-8 px-4 text-right font-medium">Margin</th>}
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) =>
                  <tr key={v.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 font-medium text-ink">{v.title}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-xs text-ink">{v.sku}</div>
                        <div className="font-mono text-[11px] text-muted">{v.barcode || '—'}</div>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right">{formatMoney(v.price)}</td>
                      <td className="tabular px-3 py-2.5 text-right text-muted">{v.wholesalePrice ? formatMoney(v.wholesalePrice) : '—'}</td>
                      <td className="tabular px-3 py-2.5 text-right text-muted">{v.compareAtPrice ? formatMoney(v.compareAtPrice) : '—'}</td>
                      {canCost && <td className="tabular px-3 py-2.5 text-right">{product.type === 'service' ? '—' : formatMoney(v.cost)}</td>}
                      {canCost && <td className="tabular px-4 py-2.5 text-right">{product.type === 'service' || v.price === 0 ? '—' : `${((v.price - v.cost) / v.price * 100).toFixed(1)}%`}</td>}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {product.type === 'bundle' &&
          <Panel title="Kit components" description="Kits available = the scarcest component at each location. Selling a kit deducts every component." flush>
              <div className="overflow-x-auto">
                <table className="mt-3 w-full text-[13px]">
                  <thead>
                    <tr className="border-y border-line bg-surface-2/50 text-xs text-muted">
                      <th scope="col" className="h-8 px-4 text-left font-medium">Component</th>
                      <th scope="col" className="h-8 px-3 text-right font-medium">Per kit</th>
                      {warehouses.map((w) =>
                    <th key={w.id} scope="col" className="h-8 px-3 text-right font-medium">{w.code}</th>
                    )}
                    </tr>
                  </thead>
                  <tbody>
                    {product.bundle.map((c) => {
                    const v = lookups.variantsById.get(c.variantId)!;
                    const p = lookups.productsById.get(v.productId)!;
                    return (
                      <tr key={c.variantId} className="border-b border-line">
                          <td className="px-4 py-2.5">
                            <Link to={`/products/${p.id}`} className="font-medium text-ink hover:underline">{p.name}</Link>
                            <div className="text-xs text-muted">{v.sku}</div>
                          </td>
                          <td className="tabular px-3 py-2.5 text-right">{c.quantity}</td>
                          {warehouses.map((w) =>
                        <td key={w.id} className="tabular px-3 py-2.5 text-right text-muted">{availableQty(getBalance(state.balances, v.id, w.id))}</td>
                        )}
                        </tr>);

                  })}
                    <tr className="bg-surface-2/40 font-medium">
                      <td className="px-4 py-2.5">Kits available</td>
                      <td />
                      {warehouses.map((w) =>
                    <td key={w.id} className="tabular px-3 py-2.5 text-right text-ink">{bundleAvailable(product, state.balances, [w.id])}</td>
                    )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>
          }

          {physical &&
          <Panel
            title="Stock by location"
            flush
            actions={
            variants.length > 1 &&
            <SegmentedControl
              label="Variant"
              value={activeVariant.id}
              onChange={setVariantId}
              options={variants.map((v) => ({ value: v.id, label: v.title.length > 18 ? v.sku : v.title }))} />


            }>
            
              <div className="overflow-x-auto">
                <table className="mt-3 w-full text-[13px]">
                  <thead>
                    <tr className="border-y border-line bg-surface-2/50 text-xs text-muted">
                      <th scope="col" className="h-8 px-4 text-left font-medium">Location</th>
                      <th scope="col" className="h-8 px-3 text-right font-medium">On hand</th>
                      <th scope="col" className="h-8 px-3 text-right font-medium">Reserved</th>
                      <th scope="col" className="h-8 px-3 text-right font-medium">Available</th>
                      <th scope="col" className="h-8 px-4 text-right font-medium">Incoming</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => {
                    const b = getBalance(state.balances, activeVariant.id, w.id);
                    const available = availableQty(b);
                    const threshold = w.kind === 'central' ? product.reorderPoint * 3 : product.reorderPoint;
                    return (
                      <tr key={w.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-2.5 text-ink">{w.name}</td>
                          <td className="tabular px-3 py-2.5 text-right">{b.onHand}</td>
                          <td className="tabular px-3 py-2.5 text-right text-muted">{b.reserved}</td>
                          <td className={cn('tabular px-3 py-2.5 text-right font-medium', available === 0 ? 'text-critical' : available <= threshold ? 'text-warning' : 'text-ink')}>{available}</td>
                          <td className="tabular px-4 py-2.5 text-right text-muted">{b.incoming || '—'}</td>
                        </tr>);

                  })}
                  </tbody>
                </table>
              </div>
            </Panel>
          }

          {movements.length > 0 &&
          <Panel
            title="Recent stock movements"
            flush
            actions={
            <Link to={`/inventory/ledger?product=${product.id}`} className="text-[13px] text-accent hover:underline">
                  Open in ledger
                </Link>
            }>
            
              <ul className="mt-2 divide-y divide-line border-t border-line">
                {movements.map((m) =>
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-4 py-2.5 text-[13px]">
                    <span className="w-36 text-xs text-muted">{formatShort(m.createdAt)}</span>
                    <span className="w-32 text-ink">{movementLabels[m.type]}</span>
                    <span className="flex-1 truncate text-muted">
                      {lookups.warehousesById.get(m.warehouseId)?.code} · {m.reference.label}
                    </span>
                    <span className={cn('tabular w-12 text-right font-medium', m.change > 0 ? 'text-positive' : 'text-critical')}>{m.change > 0 ? `+${m.change}` : m.change}</span>
                    <span className="tabular w-16 text-right text-xs text-muted">→ {m.after}</span>
                  </li>
              )}
              </ul>
            </Panel>
          }
        </div>

        <aside className="space-y-5">
          <Panel title="Summary">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Available</dt>
                <dd className="tabular font-medium text-ink">{totalAvailable === null ? 'Not tracked' : `${totalAvailable}${product.type === 'bundle' ? ' kits' : ''}`}</dd>
              </div>
              {physical && canCost &&
              <div className="flex justify-between">
                  <dt className="text-muted">Stock value at cost</dt>
                  <dd className="tabular text-ink">{formatMoney(onHandValue)}</dd>
                </div>
              }
              {physical &&
              <>
                  <div className="flex justify-between">
                    <dt className="text-muted">Reorder point</dt>
                    <dd className="tabular text-ink">{product.reorderPoint} per store</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Reorder quantity</dt>
                    <dd className="tabular text-ink">{product.reorderQty}</dd>
                  </div>
                </>
              }
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Supplier</dt>
                <dd className="text-right text-ink">{product.supplier}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Created</dt>
                <dd className="text-ink">{formatDate(product.createdAt)}</dd>
              </div>
            </dl>
            {!canCost &&
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Badge tone="outline">Restricted</Badge> Cost hidden for your role
              </p>
            }
          </Panel>
          {product.description &&
          <Panel title="Description">
              <p className="text-[13px] leading-relaxed text-ink">{product.description}</p>
            </Panel>
          }
        </aside>
      </div>
    </div>);

}