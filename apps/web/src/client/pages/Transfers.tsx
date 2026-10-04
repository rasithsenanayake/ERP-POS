import React, { useMemo, useState } from 'react';
import { ArrowRightIcon, PlusIcon, TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import type { Transfer, TransferStatus } from '../types/inventory';
import { formatShort } from '../utils/dates';

const views = [
{ id: 'open', label: 'Open' },
{ id: 'all', label: 'All' },
{ id: 'received', label: 'Received' },
{ id: 'cancelled', label: 'Cancelled' }];


const nextAction: Partial<Record<TransferStatus, string>> = {
  draft: 'Submit',
  requested: 'Approve',
  approved: 'Dispatch',
  in_transit: 'Receive'
};

export function Transfers() {
  const { state, scoped, lookups, can, actions } = useErp();
  const { openDrawer } = useUi();
  const [view, setView] = useState('open');
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const canTransfer = can('inventory.transfer');

  const rows = useMemo(() => {
    const allowed = new Set(scoped.warehouses.map((w) => w.id));
    const q = search.trim().toLowerCase();
    return state.transfers.
    filter((t) => allowed.has(t.fromWarehouseId) || allowed.has(t.toWarehouseId)).
    filter((t) => {
      if (view === 'open' && ['received', 'cancelled'].includes(t.status)) return false;
      if (view === 'received' && t.status !== 'received') return false;
      if (view === 'cancelled' && t.status !== 'cancelled') return false;
      return !q || t.number.toLowerCase().includes(q);
    }).
    sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.transfers, scoped.warehouses, view, search]);

  const advance = (t: Transfer) => {
    if (actions.advanceTransfer(t.id)) toast.success(`${t.number}: ${nextAction[t.status]?.toLowerCase()} complete`);
  };

  return (
    <div>
      <PageHeader
        title="Stock transfers"
        backTo={{ to: '/inventory', label: 'inventory' }}
        meta="Stock leaves the source on dispatch and arrives on receipt — both recorded in the ledger."
        actions={
        canTransfer &&
        <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('transfer')}>
              New transfer
            </Button>

        } />
      
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar views={views} activeView={view} onViewChange={setView} search={search} onSearchChange={setSearch} searchPlaceholder="Search transfer number" />
        {rows.length === 0 ?
        <EmptyState
          icon={TruckIcon}
          title="No transfers here"
          description="Move stock between the warehouse and stores with a transfer."
          actions={canTransfer && <Button onClick={() => openDrawer('transfer')}>New transfer</Button>} /> :


        <ul className="divide-y divide-line border-t border-line">
            {rows.map((t) => {
            const units = t.lines.reduce((s, l) => s + l.quantity, 0);
            const action = nextAction[t.status];
            return (
              <li key={t.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-ink">{t.number}</span>
                      <StatusBadge kind="transfer" status={t.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      {lookups.warehousesById.get(t.fromWarehouseId)?.name}
                      <ArrowRightIcon className="h-3 w-3" aria-hidden />
                      {lookups.warehousesById.get(t.toWarehouseId)?.name}
                      <span>· {t.lines.length} products, {units} units · {formatShort(t.createdAt)} by {lookups.usersById.get(t.createdBy)?.name.split(' ')[0]}</span>
                    </div>
                    {t.note && <div className="mt-0.5 truncate text-xs text-subtle">{t.note}</div>}
                  </div>
                  {canTransfer &&
                <div className="flex gap-2">
                      {['draft', 'requested', 'approved'].includes(t.status) &&
                  <Button size="sm" onClick={() => setCancelId(t.id)}>
                          Cancel
                        </Button>
                  }
                      {action &&
                  <Button size="sm" variant="primary" onClick={() => advance(t)}>
                          {action}
                        </Button>
                  }
                    </div>
                }
                </li>);

          })}
          </ul>
        }
      </section>
      <ConfirmationDialog
        open={cancelId !== null}
        title="Cancel this transfer?"
        description="No stock has moved yet. The transfer stays in history as cancelled."
        confirmLabel="Cancel transfer"
        onCancel={() => setCancelId(null)}
        onConfirm={() => {
          const id = cancelId;
          setCancelId(null);
          if (id && actions.cancelTransfer(id)) toast.success('Transfer cancelled');
        }} />
      
    </div>);

}