import React from 'react';
import { Link } from 'react-router-dom';
import type { TopProductRow } from '../../utils/metrics';
import { formatMoney } from '../../utils/money';
import { Panel } from '../ui/Panel';

export function TopProducts({ rows }: {rows: TopProductRow[];}) {
  const max = rows[0]?.revenue ?? 0;
  return (
    <Panel title="Top products" description="By net sales this period" className="h-full">
      {rows.length === 0 ?
      <p className="text-[13px] text-muted">No sales in this period yet.</p> :

      <ol className="space-y-3">
          {rows.map((row) =>
        <li key={row.productId}>
              <Link to={`/products/${row.productId}`} className="group block">
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate text-ink group-hover:underline">{row.name}</span>
                  <span className="tabular shrink-0 text-ink">{formatMoney(row.revenue)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent/70" style={{ width: `${max ? row.revenue / max * 100 : 0}%` }} />
                  </div>
                  <span className="tabular w-16 shrink-0 text-right text-xs text-muted">{row.units} sold</span>
                </div>
              </Link>
            </li>
        )}
        </ol>
      }
    </Panel>);

}