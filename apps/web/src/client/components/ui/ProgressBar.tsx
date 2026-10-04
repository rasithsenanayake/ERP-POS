import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'accent' | 'positive' | 'warning' | 'critical';
  label: string;
  className?: string;
}

const tones = { accent: 'bg-accent', positive: 'bg-positive', warning: 'bg-warning', critical: 'bg-critical' };

export function ProgressBar({ value, max = 100, tone = 'accent', label, className }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, value / max * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-200', tones[tone])} style={{ width: `${pct}%` }} />
    </div>);

}