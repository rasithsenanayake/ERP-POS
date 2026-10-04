import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpenIcon, DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar, FilterDef } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import type { LedgerEntry, MovementType } from '../types/inventory';
import { cn } from '../utils/cn';
import { downloadCsv } from '../utils/csv';
import { formatShort } from '../utils/dates';
import { movementLabels } from '../utils/inventory';

export function StockLedger() {
  const { state, scoped, lookups } = useErp();
  const [params] = useSearchParams();
  const productFilter = params.get('product');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const filterDefs: FilterDef[] = [
  { id: 'type', label: 'Movement', options: (Object.keys(movementLabels) as MovementType[]).map((t) => ({ value: t, label: movementLabels[t] })) },
  { id: 'warehouse', label: 'Location', options: scoped.warehouses.map((w) => ({ value: w.id, label: w.name })) }];


  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allowed = new Set(scoped.warehouses.map((w) => w.id));
    return state.ledger.
    filter((e) => {
      if (!allowed.has(e.warehouseId)) return false;
      if (productFilter && e.productId !== productFilter) return false;
      if (filters.type?.length && !filters.type.includes(e.type)) return false;
      if (filters.warehouse?.length && !filters.warehouse.includes(e.warehouseId)) return false;
      if (!q) return true;
      const v = lookups.variantsById.get(e.variantId);
      const p = lookups.productsById.get(e.productId);
      return Boolean(v?.sku.toLowerCase().includes(q) || p?.name.toLowerCase().includes(q) || e.reference.label.toLowerCase().includes(q));
    }).
    sort((a, b) => b.seq - a.seq);
  }, [state.ledger, scoped.warehouses, productFilter, filters, search, lookups]);

  const columns: Column<LedgerEntry>[] = [
  { id: 'time', header: 'Date', cell: (e) => <span className="text-muted">{formatShort(e.createdAt)}</span>, sortValue: (e) => e.seq },
  {
    id: 'product',
    header: 'Product',
    cell: (e) =>
    <div className="max-w-[240px]">
          <div className="truncate font-medium">{lookups.productsById.get(e.productId)?.name}</div>
          <div className="truncate font-mono text-xs text-muted">{lookups.variantsById.get(e.variantId)?.sku}</div>
        </div>

  },
  { id: 'location', header: 'Location', cell: (e) => lookups.warehousesById.get(e.warehouseId)?.code },
  { id: 'type', header: 'Movement', cell: (e) => movementLabels[e.type] },
  { id: 'before', header: 'Before', align: 'right', cell: (e) => <span className="text-muted">{e.before}</span> },
  { id: 'change', header: 'Change', align: 'right', cell: (e) => <span className={cn('font-medium', e.change > 0 ? 'text-positive' : 'text-critical')}>{e.change > 0 ? `+${e.change}` : e.change}</span> },
  { id: 'after', header: 'After', align: 'right', cell: (e) => e.after },
  {
    id: 'reference',
    header: 'Reference',
    cell: (e) =>
    e.reference.kind === 'order' ?
    <Link to={`/orders/${e.reference.id}`} onClick={(ev) => ev.stopPropagation()} className="text-accent hover:underline">
            {e.reference.label}
          </Link> :

    e.reference.label

  },
  { id: 'user', header: 'By', cell: (e) => <span className="text-muted">{lookups.usersById.get(e.userId)?.name.split(' ')[0]}</span> },
  { id: 'reason', header: 'Reason', cell: (e) => <span className="block max-w-[180px] truncate text-xs text-muted">{e.reason}</span> }];


  const exportCsv = () => {
    downloadCsv(
      `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Product', 'SKU', 'Location', 'Movement', 'Before', 'Change', 'After', 'Reference', 'User', 'Reason'],
      rows.map((e) => [e.createdAt, lookups.productsById.get(e.productId)?.name, lookups.variantsById.get(e.variantId)?.sku, lookups.warehousesById.get(e.warehouseId)?.name, movementLabels[e.type], e.before, e.change, e.after, e.reference.label, lookups.usersById.get(e.userId)?.name, e.reason])
    );
    toast.success(`Exported ${rows.length} ledger entries`);
  };

  const product = productFilter ? lookups.productsById.get(productFilter) : undefined;

  return (
    <div>
      <PageHeader
        title="Stock ledger"
        backTo={{ to: '/inventory', label: 'inventory' }}
        meta={product ? `Filtered to ${product.name}` : 'Every stock movement, with before and after quantities. Entries are permanent.'}
        actions={
        <Button icon={DownloadIcon} onClick={exportCsv} disabled={rows.length === 0}>
            Export
          </Button>
        } />
      
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search product, SKU or reference" filters={filterDefs} values={filters} onValuesChange={setFilters} />
        <DataTable
          label="Stock ledger"
          rows={rows}
          columns={columns}
          getRowId={(e) => e.id}
          pageSize={25}
          mobileRow={(e) =>
          <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{lookups.productsById.get(e.productId)?.name}</div>
                <div className="text-xs text-muted">
                  {movementLabels[e.type]} · {lookups.warehousesById.get(e.warehouseId)?.code} · {formatShort(e.createdAt)}
                </div>
              </div>
              <span className={cn('tabular text-[13px] font-medium', e.change > 0 ? 'text-positive' : 'text-critical')}>{e.change > 0 ? `+${e.change}` : e.change}</span>
            </div>
          }
          empty={<EmptyState icon={BookOpenIcon} title="No movements match" description="Try clearing filters." />} />
        
      </section>
    </div>);

}