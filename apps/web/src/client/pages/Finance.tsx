import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, PlusIcon, ReceiptIcon, WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseDrawer } from '../components/finance/ExpenseDrawer';
import { ProfitLossStatement } from '../components/finance/ProfitLossStatement';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { Panel } from '../components/ui/Panel';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Tabs } from '../components/ui/Tabs';
import { useErp } from '../contexts/ErpContext';
import { bankAccounts, expenses as seedExpenses } from '../data/finance';
import { useInitialLoading } from '../hooks/useInitialLoading';
import { usePersistentState } from '../hooks/usePersistentState';
import type { Expense } from '../types/finance';
import type { Order } from '../types/sales';
import { cn } from '../utils/cn';
import { DAY, formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { isRevenueOrder, orderCogs, orderDueAt, orderTotals } from '../utils/orderMath';

type Period = '30' | '90';

interface ReceivableRow {
  order: Order;
  balance: number;
  dueAt: number;
  daysOverdue: number;
}

const buckets = [
{ id: 'current', label: 'Not yet due', test: (d: number) => d <= 0 },
{ id: '1-30', label: '1–30 days', test: (d: number) => d > 0 && d <= 30 },
{ id: '31-60', label: '31–60 days', test: (d: number) => d > 30 && d <= 60 },
{ id: '60+', label: 'Over 60 days', test: (d: number) => d > 60 }];


export function Finance() {
  const { state, scoped, lookups, branchId, can, actions } = useErp();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState<Period>('30');
  const [expenses, setExpenses] = usePersistentState<Expense[]>('finance.expenses', seedExpenses);
  const canApprove = can('finance.approve');
  const [adding, setAdding] = useState(false);
  const [bucket, setBucket] = useState<string | null>(null);
  const bps = state.company.taxRateBps;
  const now = Date.now();

  const scopedExpenses = useMemo(() => expenses.filter((e) => !branchId || e.branchId === branchId || e.branchId === null), [expenses, branchId]);

  const pnl = useMemo(() => {
    const from = now - parseInt(period, 10) * DAY;
    let netSales = 0;
    let cogs = 0;
    for (const o of scoped.orders) {
      if (!isRevenueOrder(o) || new Date(o.createdAt).getTime() < from) continue;
      netSales += orderTotals(o, bps).netSales;
      cogs += orderCogs(o);
    }
    const byCat = new Map<string, number>();
    for (const e of scopedExpenses) {
      if (new Date(e.date).getTime() < from) continue;
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    }
    const expensesByCategory = Array.from(byCat, ([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    return { netSales, cogs, expensesByCategory };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped.orders, scopedExpenses, period, bps]);

  const receivables = useMemo<ReceivableRow[]>(() => {
    return scoped.orders.
    map((order) => {
      const balance = orderTotals(order, bps).balance;
      const dueAt = orderDueAt(order, order.customerId ? lookups.customersById.get(order.customerId) : undefined);
      return { order, balance, dueAt, daysOverdue: Math.floor((now - dueAt) / DAY) };
    }).
    filter((r) => r.balance > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped.orders, lookups.customersById, bps]);

  const bucketTotals = buckets.map((b) => {
    const rows = receivables.filter((r) => b.test(r.daysOverdue));
    return { ...b, total: rows.reduce((s, r) => s + r.balance, 0), count: rows.length };
  });
  const arTotal = receivables.reduce((s, r) => s + r.balance, 0);
  const arRows = bucket ? receivables.filter((r) => buckets.find((b) => b.id === bucket)!.test(r.daysOverdue)) : receivables;
  const cash = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const pendingApproval = scopedExpenses.filter((e) => e.status === 'pending_approval');

  const arColumns: Column<ReceivableRow>[] = [
  { id: 'order', header: 'Order', cell: (r) => <span className="font-medium">{r.order.number}</span>, sortValue: (r) => r.order.number },
  { id: 'customer', header: 'Customer', cell: (r) => r.order.customerId ? lookups.customersById.get(r.order.customerId)?.name : <span className="text-muted">Walk-in</span> },
  { id: 'due', header: 'Due', cell: (r) => <span className="text-muted">{formatDate(new Date(r.dueAt).toISOString())}</span>, sortValue: (r) => r.dueAt },
  {
    id: 'age',
    header: 'Status',
    cell: (r) => r.daysOverdue > 0 ? <Badge tone={r.daysOverdue > 30 ? 'critical' : 'warning'}>{r.daysOverdue} days overdue</Badge> : <Badge>Not yet due</Badge>,
    sortValue: (r) => r.daysOverdue
  },
  { id: 'balance', header: 'Balance', align: 'right', cell: (r) => <span className="font-medium">{formatMoney(r.balance)}</span>, sortValue: (r) => r.balance }];


  const expenseColumns: Column<Expense>[] = [
  { id: 'date', header: 'Date', cell: (e) => <span className="text-muted">{formatDate(e.date)}</span>, sortValue: (e) => e.date },
  { id: 'vendor', header: 'Paid to', cell: (e) => <span className="font-medium">{e.vendor}</span>, sortValue: (e) => e.vendor },
  { id: 'category', header: 'Category', cell: (e) => e.category, sortValue: (e) => e.category },
  { id: 'branch', header: 'Branch', cell: (e) => <span className="text-muted">{e.branchId ? lookups.branchesById.get(e.branchId)?.shortName : 'Company-wide'}</span> },
  {
    id: 'status',
    header: 'Status',
    cell: (e) =>
    e.status === 'paid' ?
    <Badge tone="positive" dot>
            Paid
          </Badge> :
    canApprove ?
    <Button
      size="sm"
      icon={CheckIcon}
      onClick={(ev) => {
        ev.stopPropagation();
        setExpenses((list) => list.map((x) => x.id === e.id ? { ...x, status: 'paid' } : x));
        actions.recordAudit({
          action: 'expense.approved',
          resource: 'Expense',
          resourceId: e.id,
          resourceLabel: `${e.vendor} · ${formatMoney(e.amount)}`,
          changes: [{ field: 'status', from: 'Pending approval', to: 'Paid' }]
        });
        toast.success(`Approved ${formatMoney(e.amount)} to ${e.vendor}`);
      }}>
      
            Approve
          </Button> :

    <Badge tone="warning" dot>
            Awaiting approval
          </Badge>

  },
  { id: 'amount', header: 'Amount', align: 'right', cell: (e) => formatMoney(e.amount), sortValue: (e) => e.amount }];


  return (
    <div>
      <PageHeader
        title="Finance"
        meta={`${state.company.name} · LKR`}
        actions={
        <Button variant="primary" icon={PlusIcon} onClick={() => setAdding(true)}>
            Record expense
          </Button>
        } />
      
      <Tabs
        label="Finance sections"
        value={tab}
        onChange={setTab}
        items={[
        { id: 'overview', label: 'Overview' },
        { id: 'receivables', label: 'Receivables', count: receivables.length },
        { id: 'expenses', label: 'Expenses', count: scopedExpenses.length }]
        } />
      

      <div className="mt-5">
        {tab === 'overview' &&
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div>
              <div className="mb-3 flex justify-end">
                <SegmentedControl<Period> label="Period" value={period} onChange={setPeriod} options={[{ value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} />
              </div>
              <ProfitLossStatement figures={pnl} periodLabel={period === '30' ? 'Last 30 days' : 'Last 90 days'} />
            </div>
            <div className="space-y-5">
              <Panel title="Cash position" description={formatMoney(cash)} flush>
                <ul className="mt-2 divide-y divide-line border-t border-line">
                  {bankAccounts.map((a) =>
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{a.name}</div>
                        <div className="truncate text-xs text-muted">
                          {a.bank}
                          {a.last4 !== '—' ? ` ·· ${a.last4}` : ''}
                        </div>
                      </div>
                      <span className="tabular shrink-0 text-ink">{formatMoney(a.balance)}</span>
                    </li>
                )}
                </ul>
              </Panel>
              <Panel title="Needs attention" flush>
                <ul className="mt-2 divide-y divide-line border-t border-line text-[13px]">
                  <li>
                    <button type="button" onClick={() => {setTab('receivables');setBucket('31-60');}} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-2/60">
                      <span className="text-ink">Receivables over 30 days</span>
                      <span className="tabular font-medium text-critical">{formatMoney(bucketTotals[2].total + bucketTotals[3].total)}</span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setTab('expenses')} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-2/60">
                      <span className="text-ink">Expenses awaiting approval</span>
                      <span className="tabular font-medium text-warning">{pendingApproval.length}</span>
                    </button>
                  </li>
                </ul>
              </Panel>
            </div>
          </div>
        }

        {tab === 'receivables' &&
        <>
            <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface shadow-card md:grid-cols-4" role="group" aria-label="Aging buckets">
              {bucketTotals.map((b, i) => {
              const active = bucket === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBucket(active ? null : b.id)}
                  className={cn('border-line px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2/60', i > 0 && 'md:border-l', i % 2 === 1 && 'border-l', i > 1 && 'border-t md:border-t-0', active && 'bg-accent-soft/60')}>
                  
                    <div className="text-[13px] text-muted">{b.label}</div>
                    <div className={cn('tabular mt-1 text-lg font-semibold', b.id === '60+' && b.total > 0 ? 'text-critical' : 'text-ink')}>{formatMoney(b.total, { compact: true })}</div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div className={cn('h-full', b.id === 'current' ? 'bg-accent' : b.id === '60+' ? 'bg-critical' : 'bg-warning')} style={{ width: `${arTotal ? b.total / arTotal * 100 : 0}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted">{b.count} orders</div>
                  </button>);

            })}
            </div>
            <section className="rounded-lg border border-line bg-surface shadow-card">
              <DataTable
              label="Receivables"
              rows={arRows}
              columns={arColumns}
              getRowId={(r) => r.order.id}
              onRowClick={(r) => navigate(`/orders/${r.order.id}`)}
              loading={loading}
              initialSort={{ id: 'age', dir: 'desc' }}
              empty={<EmptyState icon={WalletIcon} title="Nothing outstanding" description="Every order in this view is fully paid." />} />
            
            </section>
          </>
        }

        {tab === 'expenses' &&
        <section className="rounded-lg border border-line bg-surface shadow-card">
            <DataTable
            label="Expenses"
            rows={scopedExpenses}
            columns={expenseColumns}
            getRowId={(e) => e.id}
            loading={loading}
            initialSort={{ id: 'date', dir: 'desc' }}
            mobileRow={(e) =>
            <div className="flex justify-between gap-2 text-[13px]">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{e.vendor}</div>
                    <div className="text-xs text-muted">
                      {e.category} · {formatDate(e.date)}
                    </div>
                  </div>
                  <span className="tabular text-ink">{formatMoney(e.amount)}</span>
                </div>
            }
            empty={<EmptyState icon={ReceiptIcon} title="No expenses yet" actions={<Button icon={PlusIcon} onClick={() => setAdding(true)}>Record expense</Button>} />} />
          
          </section>
        }
      </div>

      <ExpenseDrawer
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={(e) => {
          setExpenses((list) => [e, ...list]);
          actions.recordAudit({
            action: 'expense.recorded',
            resource: 'Expense',
            resourceId: e.id,
            resourceLabel: `${e.vendor} · ${formatMoney(e.amount)}`,
            changes: [
            { field: 'category', from: '—', to: e.category },
            { field: 'status', from: '—', to: e.status === 'paid' ? 'Paid' : 'Pending approval' }]

          });
          setAdding(false);
          setTab('expenses');
          toast.success(e.status === 'paid' ? `Expense of ${formatMoney(e.amount)} recorded` : `Expense sent for owner approval`);
        }} />
      
    </div>);

}