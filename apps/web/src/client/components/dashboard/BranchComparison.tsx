import React from 'react';
import type { BranchRow } from '../../utils/metrics';
import { pctChange } from '../../utils/metrics';
import { formatMoney } from '../../utils/money';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';

export function BranchComparison({ rows, showMargin }: {rows: BranchRow[];showMargin: boolean;}) {
  return (
    <Panel title="Branch comparison" description="Net sales and margin by location for this period" flush className="h-full">
      <div className="overflow-x-auto">
        <table className="mt-3 w-full text-[13px]">
          <thead>
            <tr className="border-y border-line bg-surface-2/50 text-xs text-muted">
              <th scope="col" className="h-8 px-4 text-left font-medium">Branch</th>
              <th scope="col" className="h-8 px-3 text-right font-medium">Net sales</th>
              <th scope="col" className="hidden h-8 px-3 text-left font-medium sm:table-cell">Share</th>
              <th scope="col" className="h-8 px-3 text-right font-medium">Orders</th>
              {showMargin && <th scope="col" className="h-8 px-4 text-right font-medium">Margin</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const change = pctChange(row.summary.netSales, row.previous);
              return (
                <tr key={row.branch.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink">{row.branch.shortName}</div>
                    <div className="text-xs text-muted">AOV {formatMoney(row.summary.aov)}</div>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">
                    <div className="text-ink">{formatMoney(row.summary.netSales)}</div>
                    {change !== null &&
                    <div className={cn('text-xs', change >= 0 ? 'text-positive' : 'text-critical')}>
                        {change >= 0 ? '+' : '−'}
                        {Math.abs(change).toFixed(0)}%
                      </div>
                    }
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${row.share}%` }} />
                      </div>
                      <span className="tabular text-xs text-muted">{row.share.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right text-ink">{row.summary.orders}</td>
                  {showMargin && <td className="tabular px-4 py-2.5 text-right text-ink">{row.summary.marginPct === null ? '—' : `${row.summary.marginPct.toFixed(1)}%`}</td>}
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </Panel>);

}