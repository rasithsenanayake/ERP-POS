import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import type { Insight, InsightTone } from '../../utils/insights';
import { cn } from '../../utils/cn';

const toneBar: Record<InsightTone, string> = {
  critical: 'bg-critical',
  warning: 'bg-warning',
  positive: 'bg-positive',
  neutral: 'bg-line-strong'
};

export function InsightsList({ insights }: {insights: Insight[];}) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-line bg-surface shadow-card" aria-labelledby="insights-title">
      <header className="px-4 pb-2 pt-3.5">
        <h2 id="insights-title" className="text-sm font-semibold text-ink">
          Insights
        </h2>
        <p className="text-xs text-muted">Calculated from your orders, stock and ledger</p>
      </header>
      {insights.length === 0 ?
      <p className="px-4 pb-4 text-[13px] text-muted">Nothing unusual in this period.</p> :

      <ul className="flex-1 px-1.5 pb-1.5">
          {insights.slice(0, 6).map((insight) =>
        <li key={insight.id}>
              <Link to={insight.href} className="group flex gap-3 rounded-md px-2.5 py-2.5 transition-colors duration-150 hover:bg-surface-2">
                <span className={cn('mt-1 w-[3px] shrink-0 self-stretch rounded-full', toneBar[insight.tone])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-snug text-ink">{insight.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{insight.detail}</span>
                </span>
                <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
        )}
        </ul>
      }
    </section>);

}