import React, { ReactNode } from 'react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  delta?: number | null;
  invertDelta?: boolean;
  hint?: ReactNode;
  className?: string;
}

/** A compact metric cell. Used in hairline-divided strips rather than as stand-alone floating cards. */
export function MetricCard({ label, value, delta, invertDelta = false, hint, className }: MetricCardProps) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const good = hasDelta ? invertDelta ? delta! < 0 : delta! > 0 : false;
  const flat = hasDelta && Math.abs(delta!) < 0.5;
  return (
    <div className={cn('min-w-0 px-4 py-3', className)}>
      <div className="truncate text-[13px] text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="tabular truncate text-lg font-semibold text-ink">{value}</span>
        {hasDelta && !flat &&
        <span className={cn('inline-flex items-center text-xs font-medium tabular', good ? 'text-positive' : 'text-critical')}>
            {delta! > 0 ? <ArrowUpRightIcon className="h-3 w-3" aria-hidden /> : <ArrowDownRightIcon className="h-3 w-3" aria-hidden />}
            {Math.abs(delta!).toFixed(0)}%
          </span>
        }
      </div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
    </div>);

}