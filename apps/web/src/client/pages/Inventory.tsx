import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BoxesIcon, SlidersHorizontalIcon, TruckIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { useInitialLoading } from '../hooks/useInitialLoading';
import type { Product, Variant } from '../types/catalog';
import { cn } from '../utils/cn';
import { DAY } from '../utils/dates';
import { aggregateStock, AggregateStock, suggestedReorder } from '../utils/inventory';
import { formatMoney } from '../utils/money';

interface Row {
  variant: Variant;
  product: Product;
  stock: AggregateStock;
  low: boolean;
  dead: boolean;
  suggestion: number;
}

const views = [
{ id: 'all', label: 'All' },
{ id: 'low', label: 'Low stock' },
{ id: 'out', label: 'Out of stock' },
{ id: 'dead', label: 'No movement 90d' }];


export function Inventory() {
  const { state, scoped, lookups, can } = useErp();
  const { openDrawer } = useUi();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') ?? 'all';
  const [search, setSearch] = useState('');
  const canCost = can('products.view_cost');

  const all = useMemo<Row[]>(() => {
    const ids = scoped.warehouses.map((w) => w.id);
    const since = Date.now() - 90 * DAY;
    const moved = new Set(state.ledger.filter((e) => e.change < 0 && new Date(e.createdAt).getTime() >= since).map((e) => e.variantId));
    const rows: Row[] = [];
    for (const variant of state.variants) {
      const product = lookups.productsById.get(variant.productId);
      if (!product || product.type !== 'physical') continue;
      const stock = aggregateStock(state.balances, variant.id, ids);
      const threshold = product.reorderPoint * Math.max(1, ids.length);
      const low = product.status === 'active' && product.reorderPoint > 0 && stock.available <= threshold;
      rows.push({ variant, product, stock, low, dead: stock.onHand > 0 && !moved.has(variant.id), suggestion: low ? suggestedReorder(stock.available, threshold, product.reorderQty) : 0 });
    }
    return rows;
  }, [state.variants, state.balances, state.ledger, scoped.warehouses, lookups.productsById]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (view === 'low' && !r.low) return false;
      if (view === 'out' && r.stock.available > 0) return false;
      if (view === 'dead' && !r.dead) return false;
      return !q || r.product.name.toLowerCase().includes(q) || r.variant.sku.toLowerCase().includes(q) || r.variant.barcode.includes(q);
    });
  }, [all, view, search]);

  const setView = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('view');else
    next.set('view', id);
    setParams(next, { replace: true });
  };

  const totals = all.reduce((s, r) => ({ units: s.units + r.stock.onHand, value: s.value + r.stock.onHand * r.variant.cost, low: s.low + (r.low ? 1 : 0) }), { units: 0, value: 0, low: 0 });

  const columns: Column<Row>[] = [
  {
    id: 'product',
    header: 'Product',
    cell: (r) =>
    <div className="max-w-[280px]">
          <div className="truncate font-medium">{r.product.name}</div>
          <div className="truncate font-mono text-xs text-muted">
            {r.variant.title !== 'Default' ? `${r.variant.title} · ` : ''}
            {r.variant.sku}
          </div>
        </div>,

    sortValue: (r) => r.product.name
  },
  { id: 'onHand', header: 'On hand', align: 'right', cell: (r) => r.stock.onHand, sortValue: (r) => r.stock.onHand },
  { id: 'reserved', header: 'Reserved', align: 'right', cell: (r) => <span className="text-muted">{r.stock.reserved}</span>, sortValue: (r) => r.stock.reserved },
  {
    id: 'available',
    header: 'Available',
    align: 'right',
    cell: (r) => <span className={cn('font-medium', r.stock.available === 0 ? 'text-critical' : r.low ? 'text-warning' : 'text-ink')}>{r.stock.available}</span>,
    sortValue: (r) => r.stock.available
  },
  { id: 'incoming', header: 'Incoming', align: 'right', cell: (r) => <span className="text-muted">{r.stock.incoming || '—'}</span>, sortValue: (r) => r.stock.incoming },
  { id: 'reorder', header: 'Suggested reorder', align: 'right', cell: (r) => r.suggestion ? <span className="font-medium text-ink">{r.suggestion}</span> : <span className="text-subtle">—</span>, sortValue: (r) => r.suggestion },
  ...(canCost ? [{ id: 'value', header: 'Value at cost', align: 'right' as const, cell: (r: Row) => formatMoney(r.stock.onHand * r.variant.cost), sortValue: (r: Row) => r.stock.onHand * r.variant.cost }] : [])];


  return (
    <div>
      <PageHeader
        title="Inventory"
        meta={`${totals.units.toLocaleString()} units on hand${canCost ? ` · ${formatMoney(totals.value, { compact: true })} at cost` : ''} · ${totals.low} low-stock SKUs · ${scoped.warehouses.map((w) => w.code).join(', ')}`}
        actions={
        <>
            <Link to="/inventory/ledger" className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] text-accent hover:underline">
              Stock ledger
            </Link>
            <Button icon={TruckIcon} onClick={() => navigate('/inventory/transfers')}>
              Transfers
            </Button>
            {can('inventory.adjust') &&
          <Button variant="primary" icon={SlidersHorizontalIcon} onClick={() => openDrawer('adjust')}>
                Adjust stock
              </Button>
          }
          </>
        } />
      
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar views={views} activeView={view} onViewChange={setView} search={search} onSearchChange={setSearch} searchPlaceholder="Search product, SKU or barcode" />
        <DataTable
          label="Inventory"
          rows={rows}
          columns={columns}
          getRowId={(r) => r.variant.id}
          onRowClick={(r) => navigate(`/products/${r.product.id}`)}
          loading={loading}
          mobileRow={(r) =>
          <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{r.product.name}</div>
                <div className="truncate font-mono text-xs text-muted">{r.variant.sku}</div>
              </div>
              <span className={cn('tabular text-[13px] font-medium', r.stock.available === 0 ? 'text-critical' : r.low ? 'text-warning' : 'text-ink')}>{r.stock.available} avail.</span>
            </div>
          }
          empty={<EmptyState icon={BoxesIcon} title="Nothing matches" description="Try a different view or search." />} />
        
      </section>
    </div>);

}