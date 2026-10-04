import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}

export function Panel({ title, description, actions, children, className, bodyClassName, flush = false }: PanelProps) {
  return (
    <section className={cn('rounded-lg border border-line bg-surface shadow-card', className)}>
      {(title || actions) &&
      <header className="flex items-start justify-between gap-3 px-4 pb-0 pt-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      }
      <div className={cn(flush ? '' : 'p-4', Boolean(title) && !flush && 'pt-3', bodyClassName)}>{children}</div>
    </section>);

}
