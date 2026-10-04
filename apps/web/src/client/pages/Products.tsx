import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadIcon, PlusIcon, TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ColumnPicker } from '../components/ui/ColumnPicker';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar, FilterDef } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { useInitialLoading } from '../hooks/useInitialLoading';
import { ProductRow, useProductRows } from '../hooks/useProductRows';
import { cn } from '../utils/cn';
import { centsForCsv, downloadCsv } from '../utils/csv';
import { formatMoney } from '../utils/money';

const views = [
{ id: 'all', label: 'All' },
{ id: 'active', label: 'Active' },
{ id: 'draft', label: 'Draft' },
{ id: 'low', label: 'Low stock' }];


const typeLabels = { physical: 'Physical', service: 'Service', bundle: 'Bundle' } as const;

export function Products() {
  const { state, can } = useErp();
  const { openDrawer } = useUi();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const all = useProductRows();
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const canCost = can('products.view_cost');

  const categories = Array.from(new Set(state.products.map((p) => p.category)));
  const suppliers = Array.from(new Set(state.products.map((p) => p.supplier)));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(({ product, variants, lowStock }) => {
      if (view === 'active' && product.status !== 'active') return false;
      if (view === 'draft' && product.status !== 'draft') return false;
      if (view === 'low' && !lowStock) return false;
      if (filters.category?.length && !filters.category.includes(product.category)) return false;
      if (filters.type?.length && !filters.type.includes(product.type)) return false;
      if (filters.supplier?.length && !filters.supplier.includes(product.supplier)) return false;
      if (!q) return true;
      return product.name.toLowerCase().includes(q) || product.brand.toLowerCase().includes(q) || variants.some((v) => v.sku.toLowerCase().includes(q) || v.barcode.includes(q));
    });
  }, [all, view, filters, search]);

  const filterDefs: FilterDef[] = [
  { id: 'category', label: 'Category', options: categories.map((c) => ({ value: c, label: c })) },
  { id: 'type', label: 'Type', options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) },
  { id: 'supplier', label: 'Supplier', options: suppliers.map((s) => ({ value: s, label: s })) }];


  const priceText = (r: ProductRow) => r.minPrice === r.maxPrice ? formatMoney(r.minPrice) : `${formatMoney(r.minPrice)} – ${formatMoney(r.maxPrice).replace('Rs ', '')}`;

  const columns: Column<ProductRow>[] = [
  {
    id: 'name',
    header: 'Product',
    cell: (r) =>
    <div className="max-w-[300px]">
          <div className="truncate font-medium">{r.product.name}</div>
          <div className="truncate text-xs text-muted">
            {r.variants.length > 1 ? `${r.variants.length} variants` : r.variants[0]?.sku} · {r.product.brand}
          </div>
        </div>,

    sortValue: (r) => r.product.name
  },
  { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="product" status={r.product.status} />, sortValue: (r) => r.product.status, hideable: true },
  { id: 'type', header: 'Type', cell: (r) => <span className="text-muted">{typeLabels[r.product.type]}</span>, hideable: true },
  { id: 'category', header: 'Category', cell: (r) => <span className="text-muted">{r.product.category}</span>, sortValue: (r) => r.product.category, hideable: true },
  {
    id: 'available',
    header: 'Available',
    align: 'right',
    cell: (r) =>
    r.available === null ?
    <span className="text-subtle">Not tracked</span> :

    <span className={cn(r.available === 0 ? 'font-medium text-critical' : r.lowStock ? 'font-medium text-warning' : 'text-ink')}>
            {r.available}
            {r.product.type === 'bundle' ? ' kits' : ''}
          </span>,

    sortValue: (r) => r.available ?? -1
  },
  { id: 'price', header: 'Price', align: 'right', cell: priceText, sortValue: (r) => r.minPrice },
  ...(canCost ?
  [
  { id: 'cost', header: 'Cost', align: 'right' as const, cell: (r: ProductRow) => r.product.type === 'service' ? <span className="text-subtle">—</span> : formatMoney(r.minCost), sortValue: (r: ProductRow) => r.minCost, hideable: true },
  { id: 'margin', header: 'Margin', align: 'right' as const, cell: (r: ProductRow) => r.marginPct === null ? <span className="text-subtle">—</span> : `${r.marginPct.toFixed(1)}%`, sortValue: (r: ProductRow) => r.marginPct ?? -1, hideable: true }] :

  [])];


  const exportCsv = () => {
    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Product', 'Variant', 'SKU', 'Barcode', 'Status', 'Category', 'Price (LKR)', ...(canCost ? ['Cost (LKR)'] : [])],
      rows.flatMap((r) => r.variants.map((v) => [r.product.name, v.title, v.sku, v.barcode, r.product.status, r.product.category, centsForCsv(v.price), ...(canCost ? [centsForCsv(v.cost)] : [])]))
    );
    toast.success(`Exported ${rows.length} products`, { description: canCost ? undefined : 'Cost prices were excluded for your role.' });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        meta={`${state.products.length} products · ${state.variants.length} SKUs`}
        actions={
        <>
            <Button icon={DownloadIcon} onClick={exportCsv} disabled={rows.length === 0}>
              Export
            </Button>
            {can('products.manage') &&
          <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('product')}>
                Add product
              </Button>
          }
          </>
        } />
      
      {!canCost &&
      <p className="mb-3 flex items-center gap-2 text-xs text-muted">
          <Badge tone="outline">Restricted</Badge>Cost prices and margins are hidden for your role.
        </p>
      }
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar
          views={views}
          activeView={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, brand, SKU or barcode"
          filters={filterDefs}
          values={filters}
          onValuesChange={setFilters}
          right={<ColumnPicker columns={columns} hidden={hidden} onChange={setHidden} />} />
        
        <DataTable
          label="Products"
          rows={rows}
          columns={columns}
          getRowId={(r) => r.product.id}
          onRowClick={(r) => navigate(`/products/${r.product.id}`)}
          hiddenColumns={hidden}
          loading={loading}
          mobileRow={(r) =>
          <div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-ink">{r.product.name}</span>
                <span className="tabular text-[13px] text-ink">{formatMoney(r.minPrice)}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {r.available === null ? 'Not tracked' : `${r.available} available`} · {r.product.category}
              </div>
            </div>
          }
          empty={
          <EmptyState
            icon={TagIcon}
            title="No products match"
            description="Try another view, or clear filters."
            actions={
            <Button
              onClick={() => {
                setSearch('');
                setFilters({});
                setView('all');
              }}>
              
                  Clear filters
                </Button>
            } />

          } />
        
      </section>
    </div>);

}