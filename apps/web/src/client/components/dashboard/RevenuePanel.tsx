import React from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SeriesPoint } from '../../utils/metrics';
import { formatMoney } from '../../utils/money';
import { cn } from '../../utils/cn';

interface RevenuePanelProps {
  series: SeriesPoint[];
  current: number;
  previous: number;
  delta: number | null;
  compare: boolean;
  periodLabel: string;
  orders: number;
}

interface TooltipPayload {
  payload: SeriesPoint;
}

function ChartTooltip({ active, payload, compare }: {active?: boolean;payload?: TooltipPayload[];compare: boolean;}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-medium text-ink">{point.label}</div>
      <div className="flex items-center gap-2 text-ink">
        <span className="h-2 w-2 rounded-full bg-accent" />
        {point.current === null ? '—' : formatMoney(point.current)}
      </div>
      {compare &&
      <div className="mt-0.5 flex items-center gap-2 text-muted">
          <span className="h-0.5 w-2 bg-subtle" />
          {formatMoney(point.previous)} previous
        </div>
      }
    </div>);

}

export function RevenuePanel({ series, current, previous, delta, compare, periodLabel, orders }: RevenuePanelProps) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-line bg-surface p-4 shadow-card" aria-labelledby="revenue-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="revenue-title" className="text-[13px] font-medium text-muted">
            Net sales · {periodLabel}
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="tabular text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">{formatMoney(current)}</span>
            {delta !== null && Math.abs(delta) >= 0.5 &&
            <span className={cn('tabular text-[13px] font-medium', delta > 0 ? 'text-positive' : 'text-critical')}>
                {delta > 0 ? '+' : '−'}
                {Math.abs(delta).toFixed(1)}%
              </span>
            }
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Excludes VAT and refunds · {orders} orders{compare ? ` · previous period ${formatMoney(previous)}` : ''}
          </p>
        </div>
        {compare &&
        <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-3 border-t-2 border-dashed border-subtle" />
              Previous
            </span>
          </div>
        }
      </div>
      <div className="mt-4 h-[240px] min-h-[200px] flex-1" role="img" aria-label={`Net sales chart for ${periodLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="rgb(228 228 226)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgb(124 124 119)' }} minTickGap={24} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: 'rgb(124 124 119)' }}
              tickFormatter={(v: number) => formatMoney(v, { compact: true }).replace('Rs ', '')} />
            
            <Tooltip content={<ChartTooltip compare={compare} />} cursor={{ stroke: 'rgb(206 206 202)' }} />
            {compare && <Line type="monotone" dataKey="previous" stroke="rgb(160 160 155)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />}
            <Area type="monotone" dataKey="current" stroke="rgb(31 78 69)" strokeWidth={2} fill="rgb(31 78 69)" fillOpacity={0.07} dot={false} connectNulls={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>);

}