import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PencilIcon, PlusIcon, SearchXIcon } from 'lucide-react';
import { MetricsStrip } from '../components/dashboard/MetricsStrip';
import { ActivityTimeline } from '../components/ui/ActivityTimeline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { ErrorState } from '../components/ui/ErrorState';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs } from '../components/ui/Tabs';
import { useErp } from '../contexts/ErpContext';
import { useUi } from '../contexts/UiContext';
import { useRecordRecent } from '../hooks/useRecordRecent';
import type { Order, TimelineEvent } from '../types/sales';
import { formatDate, formatShort, timeAgo } from '../utils/dates';
import { customerTagTone as tagTone, paymentMethodLabels } from '../utils/labels';
import { customerStats } from '../utils/metrics';
import { formatMoney } from '../utils/money';
import { orderTotals, termsLabel } from '../utils/orderMath';
import { canAccessCustomer, canAccessOrder } from '../utils/permissions';

export function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { state, lookups, user, role, can, actions } = useErp();
  const { openDrawer } = useUi();
  const [tab, setTab] = useState('overview');
  const customer = state.customers.find((c) => c.id === customerId);
  const accessible = customer ? canAccessCustomer(customer, user, role) : false;
  const bps = state.company.taxRateBps;

  useRecordRecent(customer && accessible ? { type: 'customer', id: customer.id, label: customer.name, sublabel: customer.company || customer.phone, href: `/customers/${customer.id}` } : null);

  const orders = useMemo(
    () => customer ? state.orders.filter((o) => o.customerId === customer.id && canAccessOrder(o, user, role)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [],
    [state.orders, customer, user, role]
  );

  const activity = useMemo<TimelineEvent[]>(() => {
    if (!customer) return [];
    const derived: TimelineEvent[] = [];
    for (const order of orders) {
      for (const event of order.timeline) {
        if (event.type === 'created') derived.push({ ...event, id: `${event.id}-c`, message: `Placed ${order.number} · ${formatMoney(orderTotals(order, bps).total)}` });else
        if (['payment', 'refund', 'cancelled', 'returned'].includes(event.type)) derived.push({ ...event, id: `${event.id}-c`, message: `${order.number}: ${event.message}` });
      }
    }
    return [...customer.activity, ...derived];
  }, [customer, orders, bps]);

  if (!customer) {
    return <ErrorState icon={SearchXIcon} title="Customer not found" description="This customer may have been merged or the link is incorrect." actions={<Button onClick={() => navigate('/customers')}>Back to customers</Button>} />;
  }
  if (!accessible) {
    return <ErrorState title="This customer is outside your access" description={`Your role (${role.name}) can only open ${role.scope === 'OWN' ? 'customers assigned to you' : 'customers of your branch'}.`} actions={<Button onClick={() => navigate('/customers')}>Back to customers</Button>} />;
  }

  const stats = customerStats(customer, state.orders, bps);
  const salesperson = lookups.usersById.get(customer.salespersonId);
  const branch = lookups.branchesById.get(customer.branchId);
  const overLimit = customer.creditLimit > 0 && stats.outstanding > customer.creditLimit;
  const payments = orders.
  flatMap((o) => o.payments.map((p) => ({ ...p, order: o }))).
  sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const orderColumns: Column<Order>[] = [
  { id: 'number', header: 'Order', cell: (o) => <span className="font-medium">{o.number}</span>, sortValue: (o) => o.number },
  { id: 'date', header: 'Date', cell: (o) => <span className="text-muted">{formatShort(o.createdAt)}</span>, sortValue: (o) => o.createdAt },
  { id: 'payment', header: 'Payment', cell: (o) => <StatusBadge kind="payment" status={o.paymentStatus} /> },
  { id: 'status', header: 'Fulfilment', cell: (o) => <StatusBadge kind="order" status={o.status} /> },
  { id: 'total', header: 'Total', align: 'right', cell: (o) => formatMoney(orderTotals(o, bps).total), sortValue: (o) => orderTotals(o, bps).total }];


  return (
    <div>
      <PageHeader
        title={customer.name}
        backTo={{ to: '/customers', label: 'customers' }}
        badges={customer.tags.map((t) =>
        <Badge key={t} tone={tagTone(t)}>
            {t}
          </Badge>
        )}
        meta={`${customer.number}${customer.company ? ` · ${customer.company}` : ''} · ${branch?.name} · customer since ${formatDate(customer.createdAt)}`}
        actions={
        <>
            {can('customers.manage') &&
          <Button icon={PencilIcon} onClick={() => openDrawer('customer', { customerId: customer.id })}>
                Edit
              </Button>
          }
            {can('orders.create') &&
          <Button variant="primary" icon={PlusIcon} onClick={() => openDrawer('order', { customerId: customer.id })}>
                New order
              </Button>
          }
          </>
        } />
      

      <MetricsStrip
        metrics={[
        { id: 'ltv', label: 'Lifetime value', value: formatMoney(stats.ltv), hint: 'Net of refunds' },
        { id: 'orders', label: 'Orders', value: stats.orderCount },
        { id: 'aov', label: 'Average order', value: formatMoney(stats.aov) },
        {
          id: 'balance',
          label: 'Outstanding',
          value: <span className={overLimit ? 'text-critical' : stats.outstanding > 0 ? 'text-warning' : undefined}>{formatMoney(stats.outstanding)}</span>,
          hint: customer.creditLimit > 0 ? `${overLimit ? 'Over' : 'of'} ${formatMoney(customer.creditLimit, { compact: true })} limit` : 'No credit account'
        },
        { id: 'last', label: 'Last purchase', value: stats.lastOrderAt ? timeAgo(stats.lastOrderAt) : '—' },
        { id: 'points', label: 'Loyalty points', value: customer.loyaltyPoints.toLocaleString(), hint: '1 point per Rs 100' }]
        } />
      

      <div className="mt-5">
        <Tabs
          label="Customer sections"
          value={tab}
          onChange={setTab}
          items={[
          { id: 'overview', label: 'Overview' },
          { id: 'orders', label: 'Orders', count: orders.length },
          { id: 'payments', label: 'Payments', count: payments.length },
          { id: 'activity', label: 'Activity' },
          { id: 'notes', label: 'Notes', count: customer.notes.length },
          { id: 'invoices', label: 'Invoices', disabled: true, hint: 'Arrives with the Finance module' },
          { id: 'quotations', label: 'Quotations', disabled: true, hint: 'Arrives in a later phase' },
          { id: 'support', label: 'Support', disabled: true, hint: 'Arrives with the Support module' }]
          } />
        
      </div>

      <div className="mt-5">
        {tab === 'overview' &&
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Panel
            title="Recent orders"
            flush
            actions={
            orders.length > 5 &&
            <button type="button" onClick={() => setTab('orders')} className="text-[13px] text-accent hover:underline">
                    View all {orders.length}
                  </button>

            }>
            
              {orders.length === 0 ?
            <p className="px-4 pb-4 pt-2 text-[13px] text-muted">No orders yet.</p> :

            <ul className="mt-2 divide-y divide-line border-t border-line">
                  {orders.slice(0, 5).map((o) =>
              <li key={o.id}>
                      <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-surface-2/60">
                        <span className="w-24 text-[13px] font-medium text-ink">{o.number}</span>
                        <span className="flex-1 text-xs text-muted">{o.items.map((i) => i.name).join(', ')}</span>
                        <StatusBadge kind="payment" status={o.paymentStatus} />
                        <span className="tabular w-28 text-right text-[13px] text-ink">{formatMoney(orderTotals(o, bps).total)}</span>
                      </Link>
                    </li>
              )}
                </ul>
            }
            </Panel>
            <div className="space-y-5">
              <Panel title="Contact">
                <dl className="space-y-2 text-[13px]">
                  {[
                ['Mobile', customer.phone],
                ['Secondary', customer.secondaryPhone || '—'],
                ['Email', customer.email || '—'],
                ['Address', [customer.address, customer.city].filter(Boolean).join(', ') || '—']].
                map(([label, value]) =>
                <div key={label} className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="text-muted">{label}</dt>
                      <dd className="break-words text-ink">{value}</dd>
                    </div>
                )}
                </dl>
              </Panel>
              <Panel title="Account">
                <dl className="space-y-2 text-[13px]">
                  {[
                ['Salesperson', salesperson?.name ?? '—'],
                ['Payment terms', termsLabel[customer.paymentTerms]],
                ['Credit limit', customer.creditLimit ? formatMoney(customer.creditLimit) : 'None'],
                ['Source', customer.source],
                ['VAT / TIN', customer.taxId || '—']].
                map(([label, value]) =>
                <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-ink">{value}</dd>
                    </div>
                )}
                </dl>
              </Panel>
            </div>
          </div>
        }

        {tab === 'orders' &&
        <section className="rounded-lg border border-line bg-surface shadow-card">
            <DataTable
            label={`Orders for ${customer.name}`}
            rows={orders}
            columns={orderColumns}
            getRowId={(o) => o.id}
            onRowClick={(o) => navigate(`/orders/${o.id}`)}
            mobileRow={(o) =>
            <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{o.number}</span>
                  <span className="tabular text-[13px]">{formatMoney(orderTotals(o, bps).total)}</span>
                </div>
            }
            empty={<p className="px-4 py-10 text-center text-[13px] text-muted">No orders yet.</p>} />
          
          </section>
        }

        {tab === 'payments' &&
        <Panel flush>
            {payments.length === 0 ?
          <p className="px-4 py-10 text-center text-[13px] text-muted">No payments recorded.</p> :

          <ul className="divide-y divide-line">
                {payments.map((p) =>
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[13px]">
                    <span className="w-40 text-muted">{formatShort(p.createdAt)}</span>
                    <Link to={`/orders/${p.order.id}`} className="w-24 font-medium text-accent hover:underline">
                      {p.order.number}
                    </Link>
                    <span className="flex-1 text-muted">
                      {p.kind === 'payment' ? 'Payment' : 'Refund'} · {paymentMethodLabels[p.method]}
                    </span>
                    <span className={`tabular w-28 text-right ${p.kind === 'refund' ? 'text-critical' : 'text-ink'}`}>
                      {p.kind === 'refund' ? '−' : ''}
                      {formatMoney(p.amount, { decimals: true })}
                    </span>
                  </li>
            )}
              </ul>
          }
          </Panel>
        }

        {tab === 'activity' &&
        <Panel>
            <ActivityTimeline events={activity} />
          </Panel>
        }

        {tab === 'notes' &&
        <Panel>
            <ActivityTimeline events={customer.notes} onPost={(body) => Boolean(actions.addCustomerNote(customer.id, body))} emptyText="No notes yet. Notes are private to your team." />
          </Panel>
        }
      </div>
    </div>);

}