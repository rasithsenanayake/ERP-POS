import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadIcon, PlusIcon, UploadIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ColumnPicker } from '../components/ui/ColumnPicker';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar, FilterDef } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { customerTagOptions } from '../data/customers';
import { useInitialLoading } from '../hooks/useInitialLoading';
import type { Customer } from '../types/sales';
import { centsForCsv, downloadCsv } from '../utils/csv';
import { formatDate } from '../utils/dates';
import { customerStats, CustomerStats } from '../utils/metrics';
import { formatMoney } from '../utils/money';
import { customerTagTone as tagTone } from '../utils/labels';

const views = [
{ id: 'all', label: 'All' },
{ id: 'vip', label: 'VIP' },
{ id: 'wholesale', label: 'Wholesale' },
{ id: 'corporate', label: 'Corporate' },
{ id: 'balance', label: 'Has balance' }];


export function Customers() {
  const { state, scoped, lookups, can, role, branchId } = useErp();
  const { openDrawer } = useUi();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [hidden, setHidden] = useState<string[]>([]);

  const stats = useMemo(() => {
    const map = new Map<string, CustomerStats>();
    for (const c of scoped.customers) map.set(c.id, customerStats(c, state.orders, state.company.taxRateBps));
    return map;
  }, [scoped.customers, state.orders, state.company.taxRateBps]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return scoped.customers.filter((c) => {
      const s = stats.get(c.id)!;
      if (view === 'vip' && !c.tags.includes('VIP')) return false;
      if (view === 'wholesale' && !c.tags.includes('Wholesale')) return false;
      if (view === 'corporate' && !c.tags.includes('Corporate')) return false;
      if (view === 'balance' && s.outstanding <= 0) return false;
      if (filters.tags?.length && !filters.tags.some((t) => c.tags.includes(t))) return false;
      if (filters.branch?.length && !filters.branch.includes(c.branchId)) return false;
      if (filters.type?.length && !filters.type.includes(c.type)) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.number.toLowerCase().includes(q) || digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits);
    });
  }, [scoped.customers, stats, view, filters, search]);

  const filterDefs: FilterDef[] = [
  { id: 'tags', label: 'Tags', options: customerTagOptions.map((t) => ({ value: t, label: t })) },
  { id: 'type', label: 'Type', options: [{ value: 'individual', label: 'Individual' }, { value: 'business', label: 'Business' }] },
  ...(role.scope === 'ORGANIZATION' && !branchId ? [{ id: 'branch', label: 'Home branch', options: state.branches.map((b) => ({ value: b.id, label: b.shortName })) }] : [])];


  const columns: Column<Customer>[] = [
  {
    id: 'name',
    header: 'Customer',
    cell: (c) =>
    <div className="max-w-[240px]">
          <div className="truncate font-medium">{c.name}</div>
          {c.company && <div className="truncate text-xs text-muted">{c.company}</div>}
        </div>,

    sortValue: (c) => c.name
  },
  { id: 'phone', header: 'Phone', cell: (c) => <span className="tabular text-muted">{c.phone}</span>, hideable: true },
  { id: 'city', header: 'Location', cell: (c) => <span className="text-muted">{c.city}</span>, sortValue: (c) => c.city, hideable: true },
  {
    id: 'tags',
    header: 'Tags',
    cell: (c) =>
    <div className="flex gap-1">
          {c.tags.slice(0, 2).map((t) =>
      <Badge key={t} tone={tagTone(t)}>
              {t}
            </Badge>
      )}
        </div>,

    hideable: true
  },
  { id: 'orders', header: 'Orders', align: 'right', cell: (c) => stats.get(c.id)!.orderCount, sortValue: (c) => stats.get(c.id)!.orderCount, hideable: true },
  { id: 'spent', header: 'Total spent', align: 'right', cell: (c) => formatMoney(stats.get(c.id)!.ltv), sortValue: (c) => stats.get(c.id)!.ltv },
  {
    id: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (c) => {
      const o = stats.get(c.id)!.outstanding;
      return o > 0 ? <span className="font-medium text-warning">{formatMoney(o)}</span> : <span className="text-subtle">—</span>;
    },
    sortValue: (c) => stats.get(c.id)!.outstanding,
    hideable: true
  },
  {
    id: 'last',
    header: 'Last order',
    cell: (c) => {
      const last = stats.get(c.id)!.lastOrderAt;
      return <span className="text-muted">{last ? formatDate(last) : 'Never'}</span>;
    },
    sortValue: (c) => stats.get(c.id)!.lastOrderAt ?? '',
    hideable: true
  }];


  const exportCsv = () => {
    downloadCsv(
      `customers-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Number', 'Name', 'Company', 'Phone', 'Email', 'City', 'Tags', 'Home branch', 'Orders', 'Total spent (LKR)', 'Outstanding (LKR)'],
      rows.map((c) => {
        const s = stats.get(c.id)!;
        return [c.number, c.name, c.company, c.phone, c.email, c.city, c.tags.join('; '), lookups.branchesById.get(c.branchId)?.name, s.orderCount, centsForCsv(s.ltv), centsForCsv(s.outstanding)];
      })
    );
    toast.success(`Exported ${rows.length} customers`);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        meta={`${scoped.customers.length} customers${role.scope === 'OWN' ? ' assigned to you' : ''}`}
        actions={
        <>
            <Button icon={UploadIcon} disabled title="Import wizard arrives in a later phase">
              Import
            </Button>
            <Button icon={DownloadIcon} onClick={exportCsv} disabled={rows.length === 0}>
              Export
            </Button>
            {can('customers.manage') &&
          <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('customer')}>
                Add customer
              </Button>
          }
          </>
        } />
      
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar
          views={views}
          activeView={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, company, phone or email"
          filters={filterDefs}
          values={filters}
          onValuesChange={setFilters}
          right={<ColumnPicker columns={columns} hidden={hidden} onChange={setHidden} />} />
        
        <DataTable
          label="Customers"
          rows={rows}
          columns={columns}
          getRowId={(c) => c.id}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          hiddenColumns={hidden}
          loading={loading}
          initialSort={{ id: 'spent', dir: 'desc' }}
          mobileRow={(c) =>
          <div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-ink">{c.name}</span>
                <span className="tabular text-[13px] text-ink">{formatMoney(stats.get(c.id)!.ltv)}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {c.phone} · {c.city}
              </div>
            </div>
          }
          empty={
          scoped.customers.length === 0 ?
          <EmptyState
            icon={UsersIcon}
            title="No customers yet"
            description="Add customers to track their orders, balances and history in one place."
            actions={
            <>
                    {can('customers.manage') &&
              <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('customer')}>
                        Add customer
                      </Button>
              }
                    <Button icon={UploadIcon} disabled title="Later phase">
                      Import customers
                    </Button>
                  </>
            } /> :


          <EmptyState
            icon={UsersIcon}
            title="No customers match"
            description="Try another view or search term."
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