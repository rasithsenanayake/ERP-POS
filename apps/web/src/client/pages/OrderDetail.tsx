import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BanknoteIcon, CircleCheckIcon, CircleXIcon, CopyIcon, EllipsisIcon, PackageCheckIcon, PrinterIcon, SearchXIcon, Undo2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { RecordPaymentDrawer } from '../components/orders/RecordPaymentDrawer';
import { RefundDrawer } from '../components/orders/RefundDrawer';
import { ActivityTimeline } from '../components/ui/ActivityTimeline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ErrorState } from '../components/ui/ErrorState';
import { MenuItem, MenuSeparator } from '../components/ui/Menu';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Popover } from '../components/ui/Popover';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useErp } from '../contexts/ErpContext';
import { useRecordRecent } from '../hooks/useRecordRecent';
import { formatDateTime } from '../utils/dates';
import { channelLabels, paymentMethodLabels } from '../utils/labels';
import { formatMoney } from '../utils/money';
import { isOpenForFulfilment, isReservedStatus, orderTotals } from '../utils/orderMath';
import { canAccessOrder } from '../utils/permissions';
import { selectChevron, selectClass } from '../utils/styles';

const cancelReasons = ['Customer changed their mind', 'Out of stock', 'Duplicate order', 'Payment not received'];

export function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { state, lookups, user, role, can, actions } = useErp();
  const order = state.orders.find((o) => o.id === orderId);
  const accessible = order ? canAccessOrder(order, user, role) : false;
  const customer = order?.customerId ? lookups.customersById.get(order.customerId) : undefined;
  const [payOpen, setPayOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);

  useRecordRecent(order && accessible ? { type: 'order', id: order.id, label: order.number, sublabel: customer?.name ?? 'Walk-in customer', href: `/orders/${order.id}` } : null);

  if (!order) {
    return <ErrorState icon={SearchXIcon} title="Order not found" description="It may have been removed, or the link is incorrect." actions={<Button onClick={() => navigate('/orders')}>Back to orders</Button>} />;
  }
  if (!accessible) {
    return <ErrorState title="This order is outside your access" description={`Your role (${role.name}) can only see ${role.scope === 'OWN' ? 'orders assigned to you' : 'orders from your branch'}.`} actions={<Button onClick={() => navigate('/orders')}>Back to orders</Button>} />;
  }

  const totals = orderTotals(order, state.company.taxRateBps);
  const branch = lookups.branchesById.get(order.branchId);
  const warehouse = lookups.warehousesById.get(order.warehouseId);
  const assignee = lookups.usersById.get(order.assignedTo);
  const creator = lookups.usersById.get(order.createdBy);
  const canPay = can('payments.record') && totals.balance > 0 && !['draft', 'cancelled', 'refunded', 'returned'].includes(order.status);
  const canFulfil = can('orders.update') && isOpenForFulfilment(order.status);
  const canConfirm = can('orders.update') && (order.status === 'draft' || order.status === 'pending');
  const canRefund = can('orders.refund') && totals.netPaid > 0;
  const canCancel = can('orders.cancel') && !['fulfilled', 'returned', 'cancelled', 'refunded'].includes(order.status);
  const staff = state.users.filter((u) => u.kind === 'person' && (u.branchId === order.branchId || u.role === 'owner'));

  const fulfil = () => {
    const result = actions.fulfilOrder(order.id);
    if (result) toast.success(`${order.number} fulfilled`, { description: `${totals.units} units deducted from ${warehouse?.name}` });
  };
  const confirm = () => {
    const result = actions.confirmOrder(order.id);
    if (result) toast.success(`${order.number} confirmed`, { description: 'Stock reserved' });
  };

  const fulfilmentLabel =
  order.status === 'fulfilled' ?
  'Fulfilled' :
  order.status === 'returned' ?
  'Returned' :
  isReservedStatus(order.status) ?
  'Reserved — awaiting fulfilment' :
  order.status === 'cancelled' || order.status === 'refunded' ?
  'Not fulfilled' :
  'Unfulfilled';

  return (
    <div>
      <PageHeader
        title={order.number}
        favoriteLabel={order.number}
        backTo={{ to: '/orders', label: 'orders' }}
        badges={
        <>
            <StatusBadge kind="payment" status={order.paymentStatus} />
            <StatusBadge kind="order" status={order.status} />
          </>
        }
        meta={`${formatDateTime(order.createdAt)} · ${branch?.name} · ${channelLabels[order.channel]}`}
        actions={
        <>
            {canConfirm && <Button onClick={confirm}>Confirm order</Button>}
            {canFulfil &&
          <Button variant={canPay ? 'secondary' : 'primary'} icon={PackageCheckIcon} onClick={fulfil}>
                Fulfil
              </Button>
          }
            {canPay &&
          <Button variant="primary" icon={BanknoteIcon} onClick={() => setPayOpen(true)}>
                Record payment
              </Button>
          }
            <Popover
            align="end"
            className="w-52"
            trigger={({ open, toggle }) => <Button icon={EllipsisIcon} onClick={toggle} aria-expanded={open} aria-label="More actions" />}>
            
              {(close) =>
            <div role="menu">
                  <MenuItem
                icon={CopyIcon}
                disabled={!can('orders.create')}
                onClick={() => {
                  close();
                  const copy = actions.duplicateOrder(order.id);
                  if (copy) {
                    toast.success(`Draft ${copy.number} created from ${order.number}`);
                    navigate(`/orders/${copy.id}`);
                  }
                }}>
                
                    Duplicate
                  </MenuItem>
                  <MenuItem
                icon={PrinterIcon}
                onClick={() => {
                  close();
                  window.print();
                }}>
                
                    Print
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                icon={Undo2Icon}
                disabled={!canRefund}
                onClick={() => {
                  close();
                  setRefundOpen(true);
                }}>
                
                    Refund
                  </MenuItem>
                  <MenuItem
                icon={CircleXIcon}
                danger
                disabled={!canCancel}
                onClick={() => {
                  close();
                  setCancelOpen(true);
                }}>
                
                    Cancel order
                  </MenuItem>
                </div>
            }
            </Popover>
          </>
        } />
      

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Panel
            title={
            <span className="flex items-center gap-2">
                {fulfilmentLabel}
                <span className="font-normal text-muted">· {warehouse?.name}</span>
              </span>
            }
            flush>
            
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {order.items.map((item) =>
              <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.productId}`} className="text-[13px] font-medium text-ink hover:underline">
                      {item.name}
                    </Link>
                    <div className="text-xs text-muted">
                      {item.variantTitle !== 'Default' ? `${item.variantTitle} · ` : ''}
                      {item.sku}
                    </div>
                    {item.discount > 0 && <div className="mt-0.5 text-xs text-positive">Discount −{formatMoney(item.discount)}</div>}
                  </div>
                  <div className="tabular shrink-0 text-right text-[13px] text-muted">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </div>
                  <div className="tabular w-28 shrink-0 text-right text-[13px] text-ink">{formatMoney(item.unitPrice * item.quantity - item.discount)}</div>
                </li>
              )}
            </ul>
            {canFulfil &&
            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-4 py-2.5">
                <span className="text-xs text-muted">Fulfilling deducts stock from {warehouse?.name} and writes it to the ledger.</span>
                <Button size="sm" icon={PackageCheckIcon} onClick={fulfil}>
                  Fulfil items
                </Button>
              </div>
            }
          </Panel>

          <Panel
            title={
            <span className="flex items-center gap-2">
                Payment <StatusBadge kind="payment" status={order.paymentStatus} />
              </span>
            }>
            
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal · {totals.units} items</dt>
                <dd className="tabular">{formatMoney(totals.subtotal, { decimals: true })}</dd>
              </div>
              {totals.discount > 0 &&
              <div className="flex justify-between">
                  <dt className="text-muted">Discounts</dt>
                  <dd className="tabular text-positive">−{formatMoney(totals.discount, { decimals: true })}</dd>
                </div>
              }
              {totals.shipping > 0 &&
              <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="tabular">{formatMoney(totals.shipping, { decimals: true })}</dd>
                </div>
              }
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatMoney(totals.total, { decimals: true })}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Includes {state.company.taxLabel} 18%</dt>
                <dd className="tabular">{formatMoney(totals.tax, { decimals: true })}</dd>
              </div>
            </dl>
            {order.payments.length > 0 &&
            <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
                {order.payments.map((p) =>
              <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-muted">
                      {p.kind === 'payment' ? 'Paid' : 'Refunded'} · {paymentMethodLabels[p.method]} · {formatDateTime(p.createdAt)}
                      {p.reference && p.kind === 'payment' ? ` · ${p.reference}` : ''}
                    </span>
                    <span className={`tabular shrink-0 ${p.kind === 'refund' ? 'text-critical' : 'text-ink'}`}>
                      {p.kind === 'refund' ? '−' : ''}
                      {formatMoney(p.amount, { decimals: true })}
                    </span>
                  </li>
              )}
              </ul>
            }
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[13px]">
              <span className="font-medium text-ink">{totals.balance > 0 ? 'Balance due' : 'Net paid'}</span>
              <span className="tabular font-semibold text-ink">{formatMoney(totals.balance > 0 ? totals.balance : totals.netPaid, { decimals: true })}</span>
            </div>
            {canPay &&
            <div className="mt-3 flex justify-end">
                <Button size="sm" icon={BanknoteIcon} onClick={() => setPayOpen(true)}>
                  Record payment
                </Button>
              </div>
            }
          </Panel>

          <Panel title="Timeline">
            <ActivityTimeline events={order.timeline} onPost={(body) => Boolean(actions.addOrderNote(order.id, body))} />
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Customer">
            {customer ?
            <div className="space-y-3 text-[13px]">
                <div>
                  <Link to={`/customers/${customer.id}`} className="font-medium text-accent hover:underline">
                    {customer.name}
                  </Link>
                  {customer.company && <div className="text-muted">{customer.company}</div>}
                </div>
                <div className="space-y-0.5 text-muted">
                  <div>{customer.phone}</div>
                  {customer.email && <div className="truncate">{customer.email}</div>}
                  {customer.city && <div>{customer.city}</div>}
                </div>
                {customer.tags.length > 0 &&
              <div className="flex flex-wrap gap-1">
                    {customer.tags.map((t) =>
                <Badge key={t} tone={t === 'VIP' ? 'accent' : t === 'High Risk' ? 'critical' : 'neutral'}>
                        {t}
                      </Badge>
                )}
                  </div>
              }
              </div> :

            <p className="text-[13px] text-muted">Walk-in customer — no profile attached.</p>
            }
          </Panel>

          <Panel title="Assigned to">
            {can('orders.update') && !['cancelled', 'refunded'].includes(order.status) ?
            <>
                <label htmlFor="assignee" className="sr-only">
                  Assigned staff member
                </label>
                <select
                id="assignee"
                value={order.assignedTo}
                onChange={(e) => {
                  const result = actions.assignOrder(order.id, e.target.value);
                  if (result) toast.success(`Assigned to ${lookups.usersById.get(e.target.value)?.name}`);
                }}
                className={selectClass}
                style={selectChevron}>
                
                  {staff.map((u) =>
                <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                )}
                </select>
              </> :

            <p className="text-[13px] text-ink">{assignee?.name}</p>
            }
          </Panel>

          <Panel title="Details">
            <dl className="space-y-2 text-[13px]">
              {[
              ['Channel', channelLabels[order.channel]],
              ['Branch', branch?.name],
              ['Stock location', warehouse?.name],
              ['Created by', creator?.name],
              ['Fulfilled', order.fulfilledAt ? formatDateTime(order.fulfilledAt) : '—']].
              map(([label, value]) =>
              <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right text-ink">{value}</dd>
                </div>
              )}
            </dl>
            {order.customerNote &&
            <div className="mt-3 rounded-md bg-surface-2/70 px-3 py-2 text-[13px]">
                <div className="text-xs font-medium text-muted">Customer note</div>
                <p className="mt-0.5 text-ink">{order.customerNote}</p>
              </div>
            }
          </Panel>

          {order.status === 'fulfilled' && order.paymentStatus === 'paid' &&
          <p className="flex items-center gap-2 px-1 text-xs text-muted">
              <CircleCheckIcon className="h-4 w-4 text-positive" aria-hidden />
              Completed — paid and fulfilled.
            </p>
          }
        </aside>
      </div>

      <RecordPaymentDrawer open={payOpen} onClose={() => setPayOpen(false)} order={order} />
      <RefundDrawer open={refundOpen} onClose={() => setRefundOpen(false)} order={order} />
      <ConfirmationDialog
        open={cancelOpen}
        title={`Cancel ${order.number}?`}
        description={
        totals.netPaid > 0 ?
        `This order has ${formatMoney(totals.netPaid)} paid. Refund it first — cancelling is blocked until the balance is returned.` :
        isReservedStatus(order.status) ?
        `${totals.units} reserved units will be released back to ${warehouse?.name}. The order stays in your history as cancelled.` :
        'The order stays in your history as cancelled and can’t be reopened.'
        }
        confirmLabel="Cancel order"
        confirmDisabled={totals.netPaid > 0}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false);
          const result = actions.cancelOrder(order.id, cancelReason);
          if (result) toast.success(`${order.number} cancelled`);
        }}>
        
        <label htmlFor="cancel-reason" className="mb-1 block text-[13px] font-medium text-ink">
          Reason
        </label>
        <select id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={selectClass} style={selectChevron}>
          {cancelReasons.map((r) =>
          <option key={r}>{r}</option>
          )}
        </select>
      </ConfirmationDialog>
    </div>);

}