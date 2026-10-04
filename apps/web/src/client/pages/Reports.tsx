import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DownloadIcon, FileSpreadsheetIcon, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useErp } from '../contexts/ErpContext';
import { centsForCsv, downloadCsv } from '../utils/csv';
import { cn } from '../utils/cn';
import { formatMoney } from '../utils/money';
import { ReportColumn, ReportId, reportDefinitions, ReportRow, runReport } from '../utils/reports';

type Period = '7' | '30' | '90';

function formatCell(col: ReportColumn, value: string | number): string {
  if (col.kind === 'money') return formatMoney(Number(value));
  if (col.kind === 'percent') return `${Number(value).toFixed(1)}%`;
  if (col.kind === 'number') return Number(value).toLocaleString();
  return String(value);
}

export function Reports() {
  const { state, scoped, lookups, can } = useErp();
  const [reportId, setReportId] = useState<ReportId>('product');
  const [period, setPeriod] = useState<Period>('30');
  const canCost = can('products.view_cost');
  const report = reportDefinitions.find((r) => r.id === reportId)!;
  const locked = report.requiresCost && !canCost;

  const rows = useMemo<ReportRow[]>(
    () => locked ? [] : runReport(reportId, state, scoped.orders, lookups, parseInt(period, 10), scoped.warehouses.map((w) => w.id)),
    [locked, reportId, state, scoped.orders, scoped.warehouses, lookups, period]
  );
  const chartCol = report.columns.find((c) => c.key === report.chartKey)!;
  const summable = (c: ReportColumn) => (c.kind === 'money' || c.kind === 'number') && c.key !== 'aov' && c.key !== 'skus';
  const totals = report.columns.map((c) => summable(c) ? rows.reduce((s, r) => s + Number(r[c.key]), 0) : null);
  const chartData = rows.slice(0, 8).map((r) => ({ label: String(r.label), value: Number(r[report.chartKey]) }));

  const exportCsv = () => {
    downloadCsv(
      `${report.id}-report-${new Date().toISOString().slice(0, 10)}.csv`,
      report.columns.map((c) => c.kind === 'money' ? `${c.label} (LKR)` : c.label),
      rows.map((r) => report.columns.map((c) => c.kind === 'money' ? centsForCsv(Number(r[c.key])) : c.kind === 'percent' ? Number(r[c.key]).toFixed(1) : r[c.key]))
    );
    toast.success(`Exported ${report.name}`);
  };

  const grouped = ['Sales', 'Inventory', 'Receivables'].map((g) => ({ group: g, items: reportDefinitions.filter((r) => r.group === g) }));

  return (
    <div>
      <PageHeader title="Reports" meta="Live from your orders and stock — export any report to CSV." />
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Reports" className="space-y-4">
          {grouped.map((g) =>
          <div key={g.group}>
              <h2 className="px-2 pb-1 text-[11px] font-medium text-subtle">{g.group}</h2>
              <ul className="space-y-px">
                {g.items.map((r) => {
                const lockedItem = r.requiresCost && !canCost;
                return (
                  <li key={r.id}>
                      <button
                      type="button"
                      onClick={() => setReportId(r.id)}
                      aria-current={r.id === reportId}
                      className={cn(
                        'flex h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-[13px] transition-colors duration-150',
                        r.id === reportId ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(26_26_25/0.08)]' : 'text-muted hover:bg-surface/70 hover:text-ink'
                      )}>
                      
                        <span className="truncate">{r.name}</span>
                        {lockedItem && <LockIcon className="h-3 w-3 shrink-0 text-subtle" aria-label="Restricted" />}
                      </button>
                    </li>);

              })}
              </ul>
            </div>
          )}
        </nav>

        <section aria-labelledby="report-title" className="min-w-0 rounded-lg border border-line bg-surface shadow-card">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 id="report-title" className="text-sm font-semibold text-ink">
                {report.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted">{report.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {report.usesPeriod && <SegmentedControl<Period> label="Period" value={period} onChange={setPeriod} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />}
              <Button icon={DownloadIcon} onClick={exportCsv} disabled={rows.length === 0}>
                Export CSV
              </Button>
            </div>
          </header>

          {locked ?
          <EmptyState icon={LockIcon} title="This report includes cost data" description="Your role can't see product costs. Ask an owner for access." /> :
          rows.length === 0 ?
          <EmptyState icon={FileSpreadsheetIcon} title="No data for this period" description="Try a longer period." /> :

          <>
              <div className="h-56 px-2 pt-4" aria-hidden>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => v.length > 14 ? `${v.slice(0, 13)}…` : v} />
                    <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => chartCol.kind === 'money' ? formatMoney(v, { compact: true }) : v.toLocaleString()} />
                    <Tooltip
                    cursor={{ fill: 'rgb(var(--surface-2))' }}
                    contentStyle={{ borderRadius: 6, border: '1px solid rgb(var(--line))', fontSize: 12 }}
                    formatter={(v) => [formatCell(chartCol, Number(v)), chartCol.label]} />
                  
                    <Bar dataKey="value" fill="rgb(var(--accent))" radius={[3, 3, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-y border-line bg-surface-2/50 text-xs text-muted">
                      {report.columns.map((c) =>
                    <th key={c.key} scope="col" className={cn('h-9 whitespace-nowrap px-4 font-medium', c.kind === 'text' ? 'text-left' : 'text-right')}>
                          {c.label}
                        </th>
                    )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) =>
                  <tr key={`${r.label}-${i}`} className="border-b border-line">
                        {report.columns.map((c) =>
                    <td key={c.key} className={cn('whitespace-nowrap px-4 py-2', c.kind === 'text' ? 'text-left font-medium text-ink' : 'tabular text-right text-ink')}>
                            {formatCell(c, r[c.key])}
                          </td>
                    )}
                      </tr>
                  )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-2/50 font-semibold">
                      {report.columns.map((c, i) =>
                    <td key={c.key} className={cn('whitespace-nowrap px-4 py-2.5', c.kind === 'text' ? 'text-left' : 'tabular text-right')}>
                          {i === 0 ? `Total · ${rows.length} rows` : totals[i] === null ? '' : formatCell(c, totals[i]!)}
                        </td>
                    )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          }
        </section>
      </div>
    </div>);

}