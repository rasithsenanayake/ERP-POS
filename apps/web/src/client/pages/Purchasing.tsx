import React, { useMemo, useState } from 'react';
import { PlusIcon, TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { NewPurchaseOrderDrawer } from '../components/purchasing/NewPurchaseOrderDrawer';
import { PurchaseOrderDrawer } from '../components/purchasing/PurchaseOrderDrawer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar } from '../components/ui/FilterBar';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Tabs } from '../components/ui/Tabs';
import { useErp } from '../contexts/ErpContext';
import { purchaseOrders as seedOrders, suppliers } from '../data/purchasing';
import { useInitialLoading } from '../hooks/useInitialLoading';
import { usePersistentState } from '../hooks/usePersistentState';
import type { PurchaseOrder, Supplier } from '../types/purchasing';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { isPoOverdue, poOutstandingValue, poStatusMeta, poTotal, poUnits } from '../utils/purchasing';

const views = [
{ id: 'open', label: 'Open' },
{ id: 'draft', label: 'Drafts' },
{ id: 'received', label: 'Received' },
{ id: 'all', label: 'All' }];


export function Purchasing() {
  const { lookups, actions, can } = useErp();
  const loading = useInitialLoading();
  const [orders, setOrders] = usePersistentState<PurchaseOrder[]>('purchasing.orders', seedOrders);
  const canManage = can('purchasing.manage') || can('inventory.adjust');
  const [tab, setTab] = useState('orders');
  const [view, setView] = useState('open');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const now = Date.now();
  const suppliersById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((po) => {
      if (view === 'open' && !(po.status === 'sent' || po.status === 'partial')) return false;
      if (view === 'draft' && po.status !== 'draft') return false;
      if (view === 'received' && po.status !== 'received') return false;
      if (!q) return true;
      return po.number.toLowerCase().includes(q) || (suppliersById.get(po.supplierId)?.name.toLowerCase().includes(q) ?? false);
    });
  }, [orders, view, search, suppliersById]);

  const openValue = orders.reduce((s, po) => s + poOutstandingValue(po), 0);
  const overdue = orders.filter((po) => isPoOverdue(po, now));
  const awaiting = orders.filter((po) => po.status === 'sent' || po.status === 'partial').length;
  const nextNumber = `PO-${Math.max(...orders.map((o) => parseInt(o.number.slice(3), 10))) + 1}`;
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const columns: Column<PurchaseOrder>[] = [
  { id: 'number', header: 'PO', cell: (po) => <span className="font-medium">{po.number}</span>, sortValue: (po) => po.number },
  { id: 'supplier', header: 'Supplier', cell: (po) => suppliersById.get(po.supplierId)?.name, sortValue: (po) => suppliersById.get(po.supplierId)?.name ?? '' },
  { id: 'to', header: 'Deliver to', cell: (po) => <span className="text-muted">{lookups.warehousesById.get(po.warehouseId)?.code}</span> },
  {
    id: 'status',
    header: 'Status',
    cell: (po) =>
    <div className="flex items-center gap-1.5">
          <Badge tone={poStatusMeta[po.status].tone} dot>
            {poStatusMeta[po.status].label}
          </Badge>
          {isPoOverdue(po, now) && <Badge tone="critical">Overdue</Badge>}
        </div>

  },
  {
    id: 'progress',
    header: 'Received',
    cell: (po) => {
      const u = poUnits(po);
      return (
        <div className="flex w-32 items-center gap-2">
            <ProgressBar value={u.received} max={u.ordered} tone={u.received >= u.ordered ? 'positive' : 'accent'} label={`${po.number} received`} />
            <span className="tabular shrink-0 text-xs text-muted">
              {u.received}/{u.ordered}
            </span>
          </div>);

    }
  },
  { id: 'expected', header: 'Expected', cell: (po) => <span className="text-muted">{formatDate(po.expectedAt)}</span>, sortValue: (po) => po.expectedAt },
  { id: 'total', header: 'Total', align: 'right', cell: (po) => formatMoney(poTotal(po)), sortValue: (po) => poTotal(po) }];


  const supplierColumns: Column<Supplier>[] = [
  {
    id: 'name',
    header: 'Supplier',
    cell: (s) =>
    <div>
          <div className="font-medium">{s.name}</div>
          <div className="text-xs text-muted">
            {s.contact} · {s.phone}
          </div>
        </div>,

    sortValue: (s) => s.name
  },
  { id: 'terms', header: 'Terms', cell: (s) => <span className="text-muted">{s.terms}</span> },
  { id: 'lead', header: 'Lead time', align: 'right', cell: (s) => `${s.leadTimeDays} days`, sortValue: (s) => s.leadTimeDays },
  {
    id: 'ontime',
    header: 'On-time delivery',
    align: 'right',
    cell: (s) => <span className={s.onTimePct < 85 ? 'font-medium text-warning' : ''}>{s.onTimePct}%</span>,
    sortValue: (s) => s.onTimePct
  },
  {
    id: 'open',
    header: 'Open value',
    align: 'right',
    cell: (s) => {
      const v = orders.filter((o) => o.supplierId === s.id).reduce((sum, o) => sum + poOutstandingValue(o), 0);
      return v > 0 ? formatMoney(v) : <span className="text-subtle">—</span>;
    }
  }];


  return (
    <div>
      <PageHeader
        title="Purchasing"
        meta="Order from suppliers and receive goods straight into stock."
        actions={
        canManage &&
        <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>
              New purchase order
            </Button>

        } />
      

      <div className="mb-5 grid grid-cols-2 divide-x divide-line rounded-lg border border-line bg-surface shadow-card md:grid-cols-3">
        <MetricCard label="On order (unreceived value)" value={formatMoney(openValue, { compact: true })} hint={`${awaiting} POs awaiting delivery`} />
        <MetricCard label="Overdue deliveries" value={overdue.length} hint={overdue.length ? overdue.map((o) => o.number).join(', ') : 'Everything on schedule'} />
        <MetricCard className="col-span-2 border-t border-line md:col-span-1 md:border-t-0" label="Active suppliers" value={suppliers.length} hint="Average lead time 6 days" />
      </div>

      <Tabs
        label="Purchasing sections"
        value={tab}
        onChange={setTab}
        items={[
        { id: 'orders', label: 'Purchase orders', count: orders.length },
        { id: 'suppliers', label: 'Suppliers', count: suppliers.length }]
        } />
      

      <section className="mt-4 rounded-lg border border-line bg-surface shadow-card">
        {tab === 'orders' ?
        <>
            <FilterBar views={views} activeView={view} onViewChange={setView} search={search} onSearchChange={setSearch} searchPlaceholder="Search PO number or supplier" />
            <DataTable
            label="Purchase orders"
            rows={rows}
            columns={columns}
            getRowId={(po) => po.id}
            onRowClick={(po) => setSelectedId(po.id)}
            loading={loading}
            initialSort={{ id: 'number', dir: 'desc' }}
            mobileRow={(po) =>
            <div>
                  <div className="flex justify-between gap-2 text-[13px]">
                    <span className="font-medium text-ink">{po.number}</span>
                    <span className="tabular text-ink">{formatMoney(poTotal(po))}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {suppliersById.get(po.supplierId)?.name} · {poStatusMeta[po.status].label}
                  </div>
                </div>
            }
            empty={<EmptyState icon={TruckIcon} title="No purchase orders here" description="Try another view, or raise a new purchase order." />} />
          
          </> :

        <DataTable label="Suppliers" rows={suppliers} columns={supplierColumns} getRowId={(s) => s.id} loading={loading} initialSort={{ id: 'name', dir: 'asc' }} />
        }
      </section>

      <PurchaseOrderDrawer
        po={selected}
        supplier={selected ? suppliersById.get(selected.supplierId) : undefined}
        onClose={() => setSelectedId(null)}
        onChange={(po) => {
          const before = orders.find((o) => o.id === po.id);
          setOrders((list) => list.map((o) => o.id === po.id ? po : o));
          if (before && before.status !== po.status) {
            actions.recordAudit({
              action: `purchase_order.${po.status}`,
              resource: 'PurchaseOrder',
              resourceId: po.id,
              resourceLabel: po.number,
              changes: [{ field: 'status', from: poStatusMeta[before.status].label, to: poStatusMeta[po.status].label }]
            });
          }
        }} />
      
      <NewPurchaseOrderDrawer
        open={creating}
        suppliers={suppliers}
        nextNumber={nextNumber}
        onClose={() => setCreating(false)}
        onCreate={(po) => {
          setOrders((list) => [po, ...list]);
          actions.recordAudit({
            action: 'purchase_order.created',
            resource: 'PurchaseOrder',
            resourceId: po.id,
            resourceLabel: po.number,
            changes: [
            { field: 'supplier', from: '—', to: suppliersById.get(po.supplierId)?.name ?? po.supplierId },
            { field: 'total', from: '—', to: formatMoney(poTotal(po)) }]

          });
          setCreating(false);
          setView(po.status === 'draft' ? 'draft' : 'open');
          toast.success(po.status === 'draft' ? `${po.number} saved as draft` : `${po.number} sent to ${suppliersById.get(po.supplierId)?.name}`);
        }} />
      
    </div>);

}