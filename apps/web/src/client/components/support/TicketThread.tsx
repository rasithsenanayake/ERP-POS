import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, LockIcon, SendIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { cannedReplies, ticketChannelLabels, ticketPriorityLabels, ticketStatusLabels } from '../../data/support';
import type { Ticket, TicketPriority, TicketStatus } from '../../types/support';
import { cn } from '../../utils/cn';
import { formatDateTime, formatShort } from '../../utils/dates';
import { createId } from '../../utils/ids';
import { selectChevron, selectClass } from '../../utils/styles';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { slaState } from './TicketList';

interface TicketThreadProps {
  ticket: Ticket;
  now: number;
  onChange: (ticket: Ticket) => void;
  onBack: () => void;
}

export function TicketThread({ ticket, now, onChange, onBack }: TicketThreadProps) {
  const { user, state, lookups } = useErp();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const customer = lookups.customersById.get(ticket.customerId);
  const agents = state.users.filter((u) => u.kind === 'person' && u.role !== 'warehouse_staff');
  const sla = slaState(ticket, now);

  useEffect(() => {
    setBody('');
    setInternal(false);
  }, [ticket.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [ticket.messages.length, ticket.id]);

  const send = (resolve: boolean) => {
    if (!body.trim()) return;
    onChange({
      ...ticket,
      status: resolve ? 'resolved' : internal ? ticket.status : 'pending',
      assigneeId: ticket.assigneeId ?? user.id,
      messages: [...ticket.messages, { id: createId('msg'), author: 'agent', userId: user.id, body: body.trim(), at: new Date().toISOString(), internal }]
    });
    setBody('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-start gap-2">
          <button type="button" onClick={onBack} className="-ml-1 mt-0.5 rounded p-1 text-muted hover:bg-surface-2 lg:hidden" aria-label="Back to tickets">
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">{ticket.subject}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {ticket.number} · via {ticketChannelLabels[ticket.channel]} ·{' '}
              {customer ?
              <Link to={`/customers/${customer.id}`} className="text-accent hover:underline">
                  {customer.name}
                </Link> :

              'Unknown customer'
              }
              {customer && ` · ${customer.phone}`}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select aria-label="Status" value={ticket.status} onChange={(e) => onChange({ ...ticket, status: e.target.value as TicketStatus })} className={`${selectClass} h-7 w-auto text-xs`} style={selectChevron}>
            {(Object.keys(ticketStatusLabels) as TicketStatus[]).map((s) =>
            <option key={s} value={s}>
                {ticketStatusLabels[s]}
              </option>
            )}
          </select>
          <select aria-label="Priority" value={ticket.priority} onChange={(e) => onChange({ ...ticket, priority: e.target.value as TicketPriority })} className={`${selectClass} h-7 w-auto text-xs`} style={selectChevron}>
            {(Object.keys(ticketPriorityLabels) as TicketPriority[]).map((p) =>
            <option key={p} value={p}>
                {ticketPriorityLabels[p]} priority
              </option>
            )}
          </select>
          <select aria-label="Assignee" value={ticket.assigneeId ?? ''} onChange={(e) => onChange({ ...ticket, assigneeId: e.target.value || null })} className={`${selectClass} h-7 w-auto text-xs`} style={selectChevron}>
            <option value="">Unassigned</option>
            {agents.map((a) =>
            <option key={a.id} value={a.id}>
                {a.name}
              </option>
            )}
          </select>
          {sla !== 'none' &&
          <span className={cn('ml-auto text-xs', sla === 'breached' ? 'font-medium text-critical' : sla === 'soon' ? 'font-medium text-warning' : 'text-muted')}>
              {sla === 'breached' ? 'First response overdue since' : 'Respond by'} {formatShort(ticket.slaDueAt)}
            </span>
          }
        </div>
      </header>

      <ol className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-canvas/60 px-4 py-4" aria-label="Conversation">
        {ticket.messages.map((m) => {
          const agent = m.userId ? lookups.usersById.get(m.userId) : null;
          const mine = m.author === 'agent';
          return (
            <li key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
              <Avatar initials={mine ? agent?.initials ?? '?' : customer?.name.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '?'} size="sm" className={mine ? '' : 'bg-surface-2 text-muted'} />
              <div className={cn('max-w-[78%]', mine && 'text-right')}>
                <div
                  className={cn(
                    'inline-block rounded-lg px-3 py-2 text-left text-[13px] leading-relaxed',
                    m.internal ? 'border border-dashed border-warning/50 bg-warning-soft text-ink' : mine ? 'bg-accent text-white' : 'border border-line bg-surface text-ink'
                  )}>
                  
                  {m.internal &&
                  <span className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-warning">
                      <LockIcon className="h-3 w-3" aria-hidden /> Internal note
                    </span>
                  }
                  {m.body}
                </div>
                <div className="mt-1 text-[11px] text-subtle" title={formatDateTime(m.at)}>
                  {mine ? agent?.name : customer?.name} · {formatShort(m.at)}
                </div>
              </div>
            </li>);

        })}
        <div ref={endRef} />
      </ol>

      <div className={cn('border-t border-line p-3', internal && 'bg-warning-soft/50')}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-md border border-line-strong bg-surface-2 p-0.5" role="radiogroup" aria-label="Reply type">
            {[
            { v: false, l: 'Reply' },
            { v: true, l: 'Internal note' }].
            map((o) =>
            <button
              key={o.l}
              type="button"
              role="radio"
              aria-checked={internal === o.v}
              onClick={() => setInternal(o.v)}
              className={cn('h-6 rounded px-2 text-xs', internal === o.v ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(26_26_25/0.1)]' : 'text-muted')}>
              
                {o.l}
              </button>
            )}
          </div>
          {!internal &&
          cannedReplies.map((c) =>
          <button key={c.id} type="button" onClick={() => setBody(c.body)} className="h-6 rounded border border-line px-2 text-xs text-muted hover:bg-surface hover:text-ink">
                {c.label}
              </button>
          )}
        </div>
        <textarea
          aria-label={internal ? 'Internal note' : 'Reply to customer'}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(false);
          }}
          placeholder={internal ? 'Only your team sees this' : `Reply to ${customer?.name.split(' ')[0] ?? 'customer'} via ${ticketChannelLabels[ticket.channel]}`}
          className="w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto hidden text-[11px] text-subtle sm:block">⌘ Enter to send</span>
          {!internal && ticket.status !== 'resolved' &&
          <Button size="sm" disabled={!body.trim()} onClick={() => send(true)}>
              Send &amp; resolve
            </Button>
          }
          <Button size="sm" variant="primary" icon={SendIcon} disabled={!body.trim()} onClick={() => send(false)}>
            {internal ? 'Add note' : 'Send'}
          </Button>
        </div>
      </div>
    </div>);

}