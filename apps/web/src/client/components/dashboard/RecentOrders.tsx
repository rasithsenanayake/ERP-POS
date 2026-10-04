import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useErp } from '../../contexts/ErpContext';
import type { Order } from '../../types/sales';
import { formatShort } from '../../utils/dates';
import { formatMoney } from '../../utils/money';
import { orderTotals } from '../../utils/orderMath';
import { Panel } from '../ui/Panel';
import { StatusBadge } from '../ui/StatusBadge';

export function RecentOrders({ orders }: {orders: Order[];}) {
  const { lookups, state } = useErp();
  const navigate = useNavigate();
  return (
    <Panel
      title="Recent orders"
      flush
      actions={
      <Link to="/orders" className="text-[13px] text-accent hover:underline">
          View all
        </Link>
      }>
      
      <ul className="mt-2 divide-y divide-line border-t border-line">
        {orders.map((order) => {
          const customer = order.customerId ? lookups.customersById.get(order.customerId) : null;
          return (
            <li key={order.id}>
              <button type="button" onClick={() => navigate(`/orders/${order.id}`)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 text-left hover:bg-surface-2/60 md:grid-cols-[110px_1fr_140px_auto_auto_110px]">
                <span className="text-[13px] font-medium text-ink">{order.number}</span>
                <span className="tabular text-right text-[13px] text-ink md:order-last">{formatMoney(orderTotals(order, state.company.taxRateBps).total)}</span>
                <span className="truncate text-[13px] text-muted">{customer?.name ?? 'Walk-in customer'}</span>
                <span className="hidden text-xs text-muted md:block">{formatShort(order.createdAt)}</span>
                <span className="hidden md:block">
                  <StatusBadge kind="payment" status={order.paymentStatus} />
                </span>
                <span className="hidden md:block">
                  <StatusBadge kind="order" status={order.status} />
                </span>
              </button>
            </li>);

        })}
      </ul>
    </Panel>);

}