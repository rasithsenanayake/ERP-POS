import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, InboxIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { DAY } from '../../utils/dates';
import { lowStockRows } from '../../utils/metrics';
import { isOpenForFulfilment, orderDueAt, orderTotals } from '../../utils/orderMath';
import { Popover } from '../ui/Popover';

/** One place for everything that needs the signed-in user's attention, across modules. */
export function InboxPopover() {
  const { state, scoped, lookups, user, role, can } = useErp();
  const navigate = useNavigate();

  const items = useMemo(() => {
    const scopedWarehouseIds = new Set(scoped.warehouses.map((w) => w.id));
    const approvals = can('inventory.transfer') ?
    state.transfers.filter(
      (t) =>
      t.status === 'requested' && (
      t.createdBy !== user.id || role.key === 'owner') && (
      scopedWarehouseIds.has(t.fromWarehouseId) || scopedWarehouseIds.has(t.toWarehouseId))
    ).length :
    0;
    const toFulfil = scoped.orders.filter((o) => isOpenForFulfilment(o.status)).length;
    const now = Date.now();
    const overdue = scoped.orders.filter((o) => {
      const balance = orderTotals(o, state.company.taxRateBps).balance;
      if (balance <= 0 || o.status !== 'fulfilled') return false;
      return orderDueAt(o, o.customerId ? lookups.customersById.get(o.customerId) : undefined) < now - DAY;
    }).length;
    const low = lowStockRows(state.balances, state.variants, lookups.productsById, scoped.warehouses).length;
    return [
    { id: 'approvals', label: 'Transfers awaiting your approval', count: approvals, href: '/inventory/transfers' },
    { id: 'fulfil', label: 'Orders to fulfil', count: toFulfil, href: '/orders?view=to_fulfil' },
    { id: 'overdue', label: 'Overdue customer balances', count: overdue, href: '/orders?view=unpaid' },
    { id: 'low', label: 'Low-stock alerts', count: low, href: '/inventory?view=low' }];

  }, [state, scoped, lookups, user.id, role.key, can]);

  const badge = items[0].count;
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <Popover
      align="end"
      className="w-80"
      trigger={({ open, toggle }) =>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Inbox${badge ? `, ${badge} approvals waiting` : ''}`}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink">
        
          <InboxIcon className="h-4 w-4" />
          {badge > 0 &&
        <span className="tabular absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">{badge}</span>
        }
        </button>
      }>
      
      {(close) =>
      <div>
          <div className="px-2 pb-1.5 pt-1.5">
            <h2 className="text-sm font-semibold">Your inbox</h2>
            <p className="text-xs text-muted">{total === 0 ? 'Nothing needs your attention.' : 'Items needing action across modules'}</p>
          </div>
          <ul>
            {items.map((item) =>
          <li key={item.id}>
                <button
              type="button"
              disabled={item.count === 0}
              onClick={() => {
                navigate(item.href);
                close();
              }}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] hover:bg-surface-2 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent">
              
                  <span className="tabular w-7 text-right text-sm font-semibold text-ink">{item.count}</span>
                  <span className="min-w-0 flex-1 truncate text-ink">{item.label}</span>
                  {item.count > 0 && <ChevronRightIcon className="h-4 w-4 text-subtle" aria-hidden />}
                </button>
              </li>
          )}
          </ul>
        </div>
      }
    </Popover>);

}