import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type Tone = 'neutral' | 'positive' | 'warning' | 'critical' | 'info' | 'accent' | 'outline';

const tones: Record<Tone, {box: string;dot: string;}> = {
  neutral: { box: 'bg-surface-2 text-muted', dot: 'bg-subtle' },
  positive: { box: 'bg-positive-soft text-positive', dot: 'bg-positive' },
  warning: { box: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  critical: { box: 'bg-critical-soft text-critical', dot: 'bg-critical' },
  info: { box: 'bg-info-soft text-info', dot: 'bg-info' },
  accent: { box: 'bg-accent-soft text-accent', dot: 'bg-accent' },
  outline: { box: 'border border-line-strong text-muted bg-surface', dot: 'bg-subtle' }
};

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium', tones[tone].box, className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', tones[tone].dot)} aria-hidden />}
      {children}
    </span>);

}