import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../ui/MetricCard';

export interface StripMetric {
  id: string;
  label: string;
  value: ReactNode;
  delta?: number | null;
  invertDelta?: boolean;
  hint?: ReactNode;
  href?: string;
}

export function MetricsStrip({ metrics }: {metrics: StripMetric[];}) {
  return (
    <section aria-label="Key metrics" className="overflow-hidden rounded-lg border border-line bg-line shadow-card">
      <div className="grid grid-cols-2 gap-px md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) =>
        metric.href ?
        <Link key={metric.id} to={metric.href} className="bg-surface transition-colors duration-150 hover:bg-surface-2/60">
              <MetricCard label={metric.label} value={metric.value} delta={metric.delta} invertDelta={metric.invertDelta} hint={metric.hint} />
            </Link> :

        <div key={metric.id} className="bg-surface">
              <MetricCard label={metric.label} value={metric.value} delta={metric.delta} invertDelta={metric.invertDelta} hint={metric.hint} />
            </div>

        )}
      </div>
    </section>);

}