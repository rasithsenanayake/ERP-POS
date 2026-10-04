import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isToday } from 'date-fns';
import { useErp } from '../contexts/ErpContext';
import type { Order } from '../types/sales';
import { DAY } from '../utils/dates';
import { isOpenForFulfilment, orderTotals } from '../utils/orderMath';

export const orderViews = [
{ id: 'all', label: 'All' },
{ id: 'unpaid', label: 'Unpaid' },
{ id: 'to_fulfil', label: 'To fulfil' },
{ id: 'high_value', label: 'High value' },
{ id: 'mine', label: 'My orders' },
{ id: 'today', label: 'Today' }];


const HIGH_VALUE = 25_000_000;

/** Saved views, search and filters for the orders table. */
export function useOrderList() {
  const { scoped, lookups, state, user } = useErp();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') ?? 'all';
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const bps = state.company.taxRateBps;

  const setView = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('view');else
    next.set('view', id);
    setParams(next, { replace: true });
  };

  const totals = useMemo(() => new Map(scoped.orders.map((o) => [o.id, orderTotals(o, bps)])), [scoped.orders, bps]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const matchesView = (o: Order) => {
      const t = totals.get(o.id)!;
      switch (view) {
        case 'unpaid':
          return t.balance > 0 && o.status !== 'draft';
        case 'to_fulfil':
          return isOpenForFulfilment(o.status);
        case 'high_value':
          return t.total >= HIGH_VALUE;
        case 'mine':
          return o.assignedTo === user.id;
        case 'today':
          return isToday(new Date(o.createdAt));
        default:
          return true;
      }
    };
    return scoped.orders.
    filter((o) => {
      if (!matchesView(o)) return false;
      if (filters.status?.length && !filters.status.includes(o.status)) return false;
      if (filters.payment?.length && !filters.payment.includes(o.paymentStatus)) return false;
      if (filters.channel?.length && !filters.channel.includes(o.channel)) return false;
      if (filters.branch?.length && !filters.branch.includes(o.branchId)) return false;
      if (filters.date?.length) {
        const days = parseInt(filters.date[0], 10);
        if (new Date(o.createdAt).getTime() < now - days * DAY) return false;
      }
      if (!q) return true;
      const customer = o.customerId ? lookups.customersById.get(o.customerId) : null;
      return (
        o.number.toLowerCase().includes(q) ||
        customer && (customer.name.toLowerCase().includes(q) || customer.company.toLowerCase().includes(q) || customer.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '~')) ||
        o.items.some((i) => i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)));

    }).
    sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scoped.orders, view, filters, search, totals, lookups.customersById, user.id]);

  return { view, setView, search, setSearch, filters, setFilters, rows, totals };
}