import React, { Fragment, ReactNode } from 'react';
import { useErp } from '../../contexts/ErpContext';
import type { TimelineEvent } from '../../types/sales';
import { cn } from '../../utils/cn';
import { formatDay } from '../../utils/dates';
import { format } from 'date-fns';
import { NoteComposer } from './NoteComposer';

interface ActivityTimelineProps {
  events: TimelineEvent[];
  onPost?: (body: string) => boolean;
  emptyText?: string;
}

const dotTone: Partial<Record<TimelineEvent['type'], string>> = {
  payment: 'bg-positive',
  refund: 'bg-warning',
  cancelled: 'bg-critical',
  failed: 'bg-critical',
  fulfilled: 'bg-accent',
  returned: 'bg-warning',
  note: 'bg-info'
};

function renderBody(text: string, names: string[]): ReactNode {
  if (!names.length) return text;
  const pattern = new RegExp(`(${names.map((n) => `@${n}`).join('|')})`, 'g');
  return text.split(pattern).map((part, i) =>
  names.some((n) => `@${n}` === part) ?
  <span key={i} className="rounded bg-accent-soft px-0.5 font-medium text-accent">
        {part}
      </span> :

  <Fragment key={i}>{part}</Fragment>

  );
}

export function ActivityTimeline({ events, onPost, emptyText = 'No activity yet.' }: ActivityTimelineProps) {
  const { lookups, state } = useErp();
  const firstNames = state.users.filter((u) => u.kind === 'person').map((u) => u.name.split(' ')[0]);
  const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups: {day: string;items: TimelineEvent[];}[] = [];
  for (const event of sorted) {
    const day = formatDay(event.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(event);else
    groups.push({ day, items: [event] });
  }

  return (
    <div>
      {onPost &&
      <div className="mb-5">
          <NoteComposer onPost={onPost} />
        </div>
      }
      {groups.length === 0 && <p className="text-[13px] text-muted">{emptyText}</p>}
      <ol className="space-y-5">
        {groups.map((group) =>
        <li key={group.day}>
            <h3 className="mb-2 text-xs font-medium text-muted">{group.day}</h3>
            <ol className="relative ml-[5px] border-l border-line">
              {group.items.map((event) => {
              const author = lookups.usersById.get(event.userId);
              const isNote = event.type === 'note';
              return (
                <li key={event.id} className="relative pb-4 pl-5 last:pb-0">
                    <span className={cn('absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full border-2 border-surface', dotTone[event.type] ?? 'bg-line-strong')} aria-hidden />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <div className={cn('min-w-0 text-[13px] text-ink', isNote && 'w-full')}>
                        {isNote ?
                      <div className="rounded-md border border-line bg-surface-2/60 px-3 py-2">
                            <p className="whitespace-pre-wrap">{renderBody(event.message, firstNames)}</p>
                          </div> :

                      event.message
                      }
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span>{author?.name ?? 'System'}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={event.createdAt}>{format(new Date(event.createdAt), 'h:mm a')}</time>
                      {event.meta &&
                    Object.entries(event.meta).map(([key, value]) =>
                    <span key={key} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                            {key}: <span className="font-medium text-ink">{value}</span>
                          </span>
                    )}
                    </div>
                  </li>);

            })}
            </ol>
          </li>
        )}
      </ol>
    </div>);

}