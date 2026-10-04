import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheckIcon, CircleXIcon, DownloadIcon, PackageCheckIcon, PlusIcon, ReceiptTextIcon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { ColumnPicker } from '../components/ui/ColumnPicker';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar, FilterDef } from '../components/ui/FilterBar';
import { MenuItem } from '../components/ui/Menu';
import { PageHeader } from '../components/ui/PageHeader';
import { Popover } from '../components/ui/Popover';
import { StatusBadge, statusLabel } from '../components/ui/StatusBadge';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { useInitialLoading } from '../hooks/useInitialLoading';
import { orderViews, useOrderList } from '../hooks/useOrderList';
import type { Order } from '../types/sales';
import { centsForCsv, downloadCsv } from '../utils/csv';
import { formatShort } from '../utils/dates';
import { channelLabels } from '../utils/labels';
import { formatMoney } from '../utils/money';
import { selectChevron, selectClass } from '../utils/styles';

const cancelReasons = ['Customer changed their mind', 'Out of stock', 'Duplicate order', 'Payment not received'];

export function Orders() {
  const { state, lookups, can, role, branchId, actions, scoped } = useErp();
  const { openDrawer } = useUi();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const { view, setView, search, setSearch, filters, setFilters, rows, totals } = useOrderList();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<string[]>(['channel']);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);

  const staff = state.users.filter((u) => u.kind === 'person' && (!branchId || u.branchId === branchId || u.role === 'owner'));

  const filterDefs: FilterDef[] = [
  { id: 'status', label: 'Status', options: ['draft', 'pending', 'confirmed', 'processing', 'ready', 'fulfilled', 'cancelled', 'returned', 'refunded'].map((s) => ({ value: s, label: statusLabel('order', s) })) },
  { id: 'payment', label: 'Payment', options: ['unpaid', 'pending', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'failed'].map((s) => ({ value: s, label: statusLabel('payment', s) })) },
  { id: 'channel', label: 'Channel', options: Object.entries(channelLabels).map(([value, label]) => ({ value, label })) },
  ...(role.scope === 'ORGANIZATION' && !branchId ? [{ id: 'branch', label: 'Branch', options: state.branches.map((b) => ({ value: b.id, label: b.shortName })) }] : []),
  { id: 'date', label: 'Date', single: true, options: [{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }] }];


  const columns = useMemo<Column<Order>[]>(
    () => [
    { id: 'number', header: 'Order', cell: (o) => <span className="font-medium">{o.number}</span>, sortValue: (o) => o.number },
    { id: 'date', header: 'Date', cell: (o) => <span className="text-muted">{formatShort(o.createdAt)}</span>, sortValue: (o) => o.createdAt, hideable: true },
    {
      id: 'customer',
      header: 'Customer',
      cell: (o) => {
        const c = o.customerId ? lookups.customersById.get(o.customerId) : null;
        return c ? <span className="block max-w-[200px] truncate">{c.company || c.name}</span> : <span className="text-muted">Walk-in</span>;
      },
      sortValue: (o) => o.customerId ? lookups.customersById.get(o.customerId)?.name ?? '' : ''
    },
    { id: 'branch', header: 'Branch', cell: (o) => lookups.branchesById.get(o.branchId)?.shortName, sortValue: (o) => o.branchId, hideable: true },
    { id: 'channel', header: 'Channel', cell: (o) => channelLabels[o.channel], hideable: true },
    { id: 'total', header: 'Total', align: 'right', cell: (o) => formatMoney(totals.get(o.id)!.total), sortValue: (o) => totals.get(o.id)!.total },
    { id: 'payment', header: 'Payment', cell: (o) => <StatusBadge kind="payment" status={o.paymentStatus} />, sortValue: (o) => o.paymentStatus, hideable: true },
    { id: 'status', header: 'Fulfilment', cell: (o) => <StatusBadge kind="order" status={o.status} />, sortValue: (o) => o.status, hideable: true },
    { id: 'items', header: 'Items', align: 'right', cell: (o) => totals.get(o.id)!.units, sortValue: (o) => totals.get(o.id)!.units, hideable: true },
    { id: 'assigned', header: 'Assigned', cell: (o) => <span className="text-muted">{lookups.usersById.get(o.assignedTo)?.name.split(' ')[0]}</span>, hideable: true }],

    [lookups, totals]
  );

  const exportRows = (list: Order[]) => {
    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Order', 'Date', 'Customer', 'Branch', 'Channel', 'Payment status', 'Fulfilment status', 'Units', 'Total (LKR)', 'Paid (LKR)', 'Balance (LKR)'],
      list.map((o) => {
        const t = totals.get(o.id)!;
        const c = o.customerId ? lookups.customersById.get(o.customerId) : null;
        return [o.number, o.createdAt, c?.name ?? 'Walk-in', lookups.branchesById.get(o.branchId)?.name, channelLabels[o.channel], statusLabel('payment', o.paymentStatus), statusLabel('order', o.status), t.units, centsForCsv(t.total), centsForCsv(t.netPaid), centsForCsv(t.balance)];
      })
    );
    toast.success(`Exported ${list.length} orders`);
  };

  const selectedOrders = rows.filter((o) => selected.has(o.id));

  const reportBulk = (label: string, result: {ok: number;failed: string[];}) => {
    if (result.ok) toast.success(`${label} ${result.ok} order${result.ok > 1 ? 's' : ''}`);
    if (result.failed.length) toast.error(`${result.failed.length} skipped`, { description: `${result.failed.slice(0, 4).join(', ')}${result.failed.length > 4 ? '…' : ''} couldn't be updated in their current state.` });
    setSelected(new Set());
  };

  const filtersActive = search || Object.values(filters).some((v) => v.length) || view !== 'all';

  return (
    <div>
      <PageHeader
        title="Orders"
        meta={`${scoped.orders.length} orders in your scope`}
        actions={
        <>
            <Button icon={DownloadIcon} onClick={() => exportRows(rows)} disabled={rows.length === 0}>
              Export
            </Button>
            {can('orders.create') &&
          <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('order')}>
                Create order
              </Button>
          }
          </>
        } />
      
      <section className="overflow-visible rounded-lg border border-line bg-surface shadow-card">
        <FilterBar
          views={orderViews}
          activeView={view}
          onViewChange={(id) => {
            setView(id);
            setSelected(new Set());
          }}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search order, customer, phone or SKU"
          filters={filterDefs}
          values={filters}
          onValuesChange={setFilters}
          right={<ColumnPicker columns={columns} hidden={hidden} onChange={setHidden} />} />
        
        <DataTable
          label="Orders"
          rows={rows}
          columns={columns}
          getRowId={(o) => o.id}
          onRowClick={(o) => navigate(`/orders/${o.id}`)}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          hiddenColumns={hidden}
          loading={loading}
          mobileRow={(o) => {
            const c = o.customerId ? lookups.customersById.get(o.customerId) : null;
            return (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">{o.number}</span>
                  <span className="tabular text-[13px] text-ink">{formatMoney(totals.get(o.id)!.total)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted">
                  <span className="truncate">{c?.name ?? 'Walk-in'} · {formatShort(o.createdAt)}</span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <StatusBadge kind="payment" status={o.paymentStatus} />
                  <StatusBadge kind="order" status={o.status} />
                </div>
              </div>);

          }}
          bulkBar={
          <>
              {can('orders.update') &&
            <Button size="sm" icon={PackageCheckIcon} onClick={() => reportBulk('Fulfilled', actions.bulkFulfil(Array.from(selected)))}>
                  Mark fulfilled
                </Button>
            }
              {can('orders.update') &&
            <Popover
              align="end"
              className="w-56"
              trigger={({ toggle }) =>
              <Button size="sm" icon={UserPlusIcon} onClick={toggle}>
                      Assign
                    </Button>
              }>
              
                  {(close) =>
              <div role="menu">
                      {staff.map((u) =>
                <MenuItem
                  key={u.id}
                  onClick={() => {
                    reportBulk(`Assigned to ${u.name.split(' ')[0]}:`, actions.bulkAssign(Array.from(selected), u.id));
                    close();
                  }}
                  hint={u.title}>
                  
                          {u.name}
                        </MenuItem>
                )}
                    </div>
              }
                </Popover>
            }
              <Button size="sm" icon={DownloadIcon} onClick={() => exportRows(selectedOrders)}>
                Export
              </Button>
              {can('orders.cancel') &&
            <Button size="sm" icon={CircleXIcon} onClick={() => setCancelOpen(true)} className="text-critical">
                  Cancel
                </Button>
            }
            </>
          }
          empty={
          scoped.orders.length === 0 ?
          <EmptyState
            icon={ReceiptTextIcon}
            title="No orders yet"
            description="Orders from every channel will appear here once you create your first sale."
            actions={can('orders.create') && <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('order')}>Create order</Button>} /> :


          <EmptyState
            icon={CheckCheckIcon}
            title={view === 'to_fulfil' && !search ? 'Nothing left to fulfil' : 'No orders match these filters'}
            description={filtersActive ? 'Try a different view or clear the filters.' : undefined}
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

      <ConfirmationDialog
        open={cancelOpen}
        title={`Cancel ${selected.size} order${selected.size > 1 ? 's' : ''}?`}
        description="Reserved stock is released back to available. Orders that are fulfilled or have payments are skipped — refund those individually."
        confirmLabel="Cancel orders"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false);
          reportBulk('Cancelled', actions.bulkCancel(Array.from(selected), cancelReason));
        }}>
        
        <label htmlFor="bulk-cancel-reason" className="mb-1 block text-[13px] font-medium text-ink">
          Reason
        </label>
        <select id="bulk-cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={selectClass} style={selectChevron}>
          {cancelReasons.map((r) =>
          <option key={r}>{r}</option>
          )}
        </select>
      </ConfirmationDialog>
    </div>);

}