import React, { useMemo, useState } from 'react';
import { MessagesSquareIcon } from 'lucide-react';
import { toast } from 'sonner';
import { slaState, TicketList } from '../components/support/TicketList';
import { TicketThread } from '../components/support/TicketThread';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import { tickets as seedTickets } from '../data/support';
import { usePersistentState } from '../hooks/usePersistentState';
import type { Ticket } from '../types/support';
import { cn } from '../utils/cn';

const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 };

export function Support() {
  const { user } = useErp();
  const [tickets, setTickets] = usePersistentState<Ticket[]>('support.tickets', seedTickets);
  const [view, setView] = useState('open');
  const [selectedId, setSelectedId] = useState<string | null>(seedTickets[0]?.id ?? null);
  const [mobileThread, setMobileThread] = useState(false);
  const now = Date.now();

  const views = [
  { id: 'open', label: 'Open', filter: (t: Ticket) => t.status === 'open' },
  { id: 'mine', label: 'Mine', filter: (t: Ticket) => t.assigneeId === user.id && t.status !== 'resolved' },
  { id: 'unassigned', label: 'Unassigned', filter: (t: Ticket) => !t.assigneeId && t.status !== 'resolved' },
  { id: 'pending', label: 'Waiting', filter: (t: Ticket) => t.status === 'pending' },
  { id: 'resolved', label: 'Resolved', filter: (t: Ticket) => t.status === 'resolved' }];


  const list = useMemo(() => {
    const f = views.find((v) => v.id === view)!.filter;
    return tickets.filter(f).sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, view, user.id]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const breached = tickets.filter((t) => slaState(t, now) === 'breached').length;
  const openCount = tickets.filter((t) => t.status === 'open').length;

  const update = (next: Ticket) => {
    const prev = tickets.find((t) => t.id === next.id);
    setTickets((all) => all.map((t) => t.id === next.id ? next : t));
    if (prev && prev.status !== 'resolved' && next.status === 'resolved') toast.success(`${next.number} resolved`);else
    if (prev && next.messages.length > prev.messages.length) toast.success(next.messages[next.messages.length - 1].internal ? 'Note added' : 'Reply sent');
  };

  return (
    <div>
      <PageHeader
        title="Support"
        meta={
        <>
            {openCount} open
            {breached > 0 && <span className="font-medium text-critical"> · {breached} past first-response SLA</span>}
          </>
        } />
      
      <div className="grid overflow-hidden rounded-lg border border-line bg-surface shadow-card lg:h-[calc(100vh-190px)] lg:min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className={cn('flex min-h-0 flex-col border-line lg:border-r', mobileThread && 'hidden lg:flex')}>
          <div className="flex gap-1 overflow-x-auto border-b border-line px-2" role="tablist" aria-label="Ticket views">
            {views.map((v) => {
              const count = tickets.filter(v.filter).length;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={view === v.id}
                  onClick={() => setView(v.id)}
                  className={cn('relative h-10 shrink-0 whitespace-nowrap px-2 text-[13px]', view === v.id ? 'font-medium text-ink' : 'text-muted hover:text-ink')}>
                  
                  {v.label} <span className="tabular text-xs text-subtle">{count}</span>
                  {view === v.id && <span className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-ink" />}
                </button>);

            })}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TicketList
              tickets={list}
              selectedId={selectedId}
              now={now}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileThread(true);
              }} />
            
          </div>
        </div>
        <div className={cn('min-h-[520px] lg:min-h-0', !mobileThread && 'hidden lg:block')}>
          {selected ?
          <TicketThread ticket={selected} now={now} onChange={update} onBack={() => setMobileThread(false)} /> :

          <EmptyState icon={MessagesSquareIcon} title="Select a ticket" description="Pick a conversation from the list to reply." />
          }
        </div>
      </div>
    </div>);

}