import React from 'react';
import { cn } from '../../utils/cn';
import { formatMoney } from '../../utils/money';

export interface PnlFigures {
  netSales: number;
  cogs: number;
  expensesByCategory: {category: string;amount: number;}[];
}

export function ProfitLossStatement({ figures, periodLabel }: {figures: PnlFigures;periodLabel: string;}) {
  const gross = figures.netSales - figures.cogs;
  const opex = figures.expensesByCategory.reduce((s, e) => s + e.amount, 0);
  const net = gross - opex;
  const pct = (v: number) => figures.netSales > 0 ? `${(v / figures.netSales * 100).toFixed(1)}%` : '—';

  const Row = ({ label, value, strong, indent, negative }: {label: string;value: number;strong?: boolean;indent?: boolean;negative?: boolean;}) =>
  <tr className={cn('border-b border-line last:border-0', strong && 'bg-surface-2/50')}>
      <th scope="row" className={cn('py-2.5 pr-4 text-left font-normal', indent ? 'pl-8 text-muted' : 'pl-4', strong && 'font-semibold text-ink')}>
        {label}
      </th>
      <td className={cn('tabular py-2.5 text-right', strong ? 'font-semibold text-ink' : 'text-ink')}>{negative ? formatMoney(-value) : formatMoney(value)}</td>
      <td className="tabular w-20 py-2.5 pr-4 text-right text-xs text-muted">{pct(value)}</td>
    </tr>;


  return (
    <section className="rounded-lg border border-line bg-surface shadow-card" aria-labelledby="pnl-title">
      <header className="flex items-baseline justify-between px-4 pb-2 pt-4">
        <h2 id="pnl-title" className="text-sm font-semibold text-ink">
          Profit &amp; loss
        </h2>
        <span className="text-xs text-muted">{periodLabel} · excludes VAT</span>
      </header>
      <div className="px-4 pb-4">
        <div className="text-[13px] text-muted">Net profit</div>
        <div className={cn('tabular mt-0.5 text-[28px] font-semibold leading-tight tracking-[-0.02em]', net >= 0 ? 'text-ink' : 'text-critical')}>{formatMoney(net)}</div>
        <div className="text-xs text-muted">{pct(net)} net margin</div>
      </div>
      <table className="w-full text-[13px]">
        <tbody>
          <Row label="Net sales" value={figures.netSales} />
          <Row label="Cost of goods sold" value={figures.cogs} negative />
          <Row label="Gross profit" value={gross} strong />
          {figures.expensesByCategory.map((e) =>
          <Row key={e.category} label={e.category} value={e.amount} indent negative />
          )}
          <Row label="Operating expenses" value={opex} negative />
          <Row label="Net profit" value={net} strong />
        </tbody>
      </table>
    </section>);

}