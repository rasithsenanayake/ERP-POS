import React from 'react';
import { InboxIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { ticketChannelLabels } from '../../data/support';
import type { Ticket } from '../../types/support';
import { cn } from '../../utils/cn';
import { timeAgo } from '../../utils/dates';
import { EmptyState } from '../ui/EmptyState';

interface TicketListProps {
  tickets: Ticket[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
}

export function slaState(ticket: Ticket, now: number): 'breached' | 'soon' | 'ok' | 'none' {
  if (ticket.status !== 'open') return 'none';
  const left = new Date(ticket.slaDueAt).getTime() - now;
  if (left < 0) return 'breached';
  if (left < 2 * 3_600_000) return 'soon';
  return 'ok';
}

export function TicketList({ tickets, selectedId, onSelect, now }: TicketListProps) {
  const { lookups } = useErp();
  if (tickets.length === 0) return <EmptyState icon={InboxIcon} title="Inbox zero" description="No tickets in this view." />;
  return (
    <ul className="divide-y divide-line" aria-label="Tickets">
      {tickets.map((t) => {
        const customer = lookups.customersById.get(t.customerId);
        const last = t.messages[t.messages.length - 1];
        const sla = slaState(t, now);
        const active = t.id === selectedId;
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              aria-current={active}
              className={cn('relative block w-full px-4 py-3 text-left transition-colors duration-100', active ? 'bg-accent-soft/60' : 'hover:bg-surface-2/60')}>
              
              {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden />}
              <div className="flex items-center justify-between gap-2">
                <span className={cn('truncate text-[13px]', t.status === 'open' ? 'font-semibold text-ink' : 'text-ink')}>{customer?.name ?? 'Unknown customer'}</span>
                <span className="shrink-0 text-[11px] text-subtle">{timeAgo(last?.at ?? t.createdAt)}</span>
              </div>
              <div className="mt-0.5 truncate text-[13px] text-ink">{t.subject}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                <span>{t.number}</span>
                <span>· {ticketChannelLabels[t.channel]}</span>
                {(t.priority === 'urgent' || t.priority === 'high') && <span className={t.priority === 'urgent' ? 'font-medium text-critical' : 'text-warning'}>· {t.priority === 'urgent' ? 'Urgent' : 'High'}</span>}
                {sla === 'breached' && <span className="font-medium text-critical">· SLA breached</span>}
                {sla === 'soon' && <span className="font-medium text-warning">· Due soon</span>}
              </div>
            </button>
          </li>);

      })}
    </ul>);

}