import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckIcon, ChevronDownIcon, LayoutGridIcon } from 'lucide-react';
import { BranchComparison } from '../components/dashboard/BranchComparison';
import { InsightsList } from '../components/dashboard/InsightsList';
import { MetricsStrip, StripMetric } from '../components/dashboard/MetricsStrip';
import { RecentOrders } from '../components/dashboard/RecentOrders';
import { RevenuePanel } from '../components/dashboard/RevenuePanel';
import { SetupChecklist } from '../components/dashboard/SetupChecklist';
import { TopProducts } from '../components/dashboard/TopProducts';
import { WidgetCustomizer } from '../components/dashboard/WidgetCustomizer';
import { Button } from '../components/ui/Button';
import { MenuItem } from '../components/ui/Menu';
import { PageHeader } from '../components/ui/PageHeader';
import { Popover } from '../components/ui/Popover';
import { Skeleton } from '../components/ui/Skeleton';
import { useErp } from '../contexts/ErpContext';
import { usePreferences, WidgetId } from '../contexts/PreferencesContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useInitialLoading } from '../hooks/useInitialLoading';
import { cn } from '../utils/cn';
import { formatMoney } from '../utils/money';
import { PeriodKey, periodLabels } from '../utils/metrics';

const spans: Record<WidgetId, string> = {
  revenue: 'lg:col-span-8',
  insights: 'lg:col-span-4',
  metrics: 'lg:col-span-12',
  branches: 'lg:col-span-7',
  topProducts: 'lg:col-span-5',
  recentOrders: 'lg:col-span-12'
};

function greeting(date: Date): string {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function Dashboard() {
  const { user, can, state, branchId, isModuleOn } = useErp();
  const { period, setPeriod, compare, setCompare, widgets } = usePreferences();
  const data = useDashboardData();
  const loading = useInitialLoading();
  const [customizing, setCustomizing] = useState(false);
  const branch = branchId ? state.branches.find((b) => b.id === branchId) : null;
  const canCost = can('products.view_cost');

  const metrics: StripMetric[] = [
  { id: 'orders', label: 'Orders', value: data.current.orders, delta: compare ? data.ordersDelta : null, href: isModuleOn('sales') ? '/orders' : undefined },
  { id: 'aov', label: 'Average order value', value: formatMoney(data.current.aov), delta: compare ? data.aovDelta : null },
  canCost ?
  { id: 'gp', label: 'Gross profit', value: formatMoney(data.current.grossProfit, { compact: true }), delta: compare ? data.profitDelta : null, hint: data.current.marginPct === null ? undefined : `${data.current.marginPct.toFixed(1)}% margin` } :
  { id: 'units', label: 'Units sold', value: data.current.units },
  { id: 'ar', label: 'Receivables', value: formatMoney(data.receivables.total, { compact: true }), hint: `${data.receivables.count} open balances`, href: isModuleOn('sales') ? '/orders?view=unpaid' : undefined },
  canCost ?
  { id: 'inv', label: 'Inventory value', value: formatMoney(data.inventoryValue, { compact: true }), hint: `${data.unitsOnHand.toLocaleString()} units at cost` } :
  { id: 'inv-units', label: 'Units on hand', value: data.unitsOnHand.toLocaleString() },
  { id: 'low', label: 'Low-stock alerts', value: data.lowStockCount, hint: 'At or below reorder point', href: isModuleOn('inventory') ? '/inventory?view=low' : undefined }];


  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'revenue':
        return <RevenuePanel series={data.series} current={data.current.netSales} previous={data.previous.netSales} delta={compare ? data.salesDelta : null} compare={compare} periodLabel={periodLabels[period].toLowerCase()} orders={data.current.orders} />;
      case 'insights':
        return <InsightsList insights={data.insights} />;
      case 'metrics':
        return <MetricsStrip metrics={metrics} />;
      case 'branches':
        return data.branches.length > 1 ? <BranchComparison rows={data.branches} showMargin={canCost} /> : null;
      case 'topProducts':
        return <TopProducts rows={data.topProducts} />;
      case 'recentOrders':
        return isModuleOn('sales') && data.recentOrders.length > 0 ? <RecentOrders orders={data.recentOrders} /> : null;
    }
  };

  const visible = widgets.filter((w) => w.visible);

  return (
    <div>
      <PageHeader
        title="Home"
        meta={`${greeting(new Date())}, ${user.name.split(' ')[0]} · ${branch ? branch.name : 'All branches'} · ${format(new Date(), 'EEEE d MMMM')}`}
        actions={
        <>
            <Popover
            align="end"
            className="w-48"
            trigger={({ open, toggle }) =>
            <Button onClick={toggle} aria-expanded={open} iconRight={ChevronDownIcon}>
                  {periodLabels[period]}
                </Button>
            }>
            
              {(close) =>
            <div role="menu">
                  {(Object.keys(periodLabels) as PeriodKey[]).map((key) =>
              <MenuItem
                key={key}
                icon={key === period ? CheckIcon : undefined}
                active={key === period}
                onClick={() => {
                  setPeriod(key);
                  close();
                }}>
                
                      <span className={key === period ? '' : 'pl-6'}>{periodLabels[key]}</span>
                    </MenuItem>
              )}
                </div>
            }
            </Popover>
            <Button onClick={() => setCompare(!compare)} aria-pressed={compare} className={cn(compare && 'border-accent/40 bg-accent-soft text-accent hover:bg-accent-soft')}>
              Compare to previous
            </Button>
            <Button icon={LayoutGridIcon} onClick={() => setCustomizing(true)}>
              Customize
            </Button>
          </>
        } />
      

      <SetupChecklist />

      {loading ?
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-[340px] lg:col-span-8" />
          <Skeleton className="h-[340px] lg:col-span-4" />
          <Skeleton className="h-[84px] lg:col-span-12" />
        </div> :
      visible.length === 0 ?
      <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink">All widgets are hidden</p>
          <p className="mt-1 text-[13px] text-muted">Choose what to show on your home page.</p>
          <Button className="mt-4" onClick={() => setCustomizing(true)}>
            Customize home
          </Button>
        </div> :

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {visible.map((widget) => {
          const content = renderWidget(widget.id);
          if (!content) return null;
          return (
            <div key={widget.id} className={cn('min-w-0', spans[widget.id])}>
                {content}
              </div>);

        })}
        </div>
      }

      <WidgetCustomizer open={customizing} onClose={() => setCustomizing(false)} />
    </div>);

}