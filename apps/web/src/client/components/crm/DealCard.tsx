import React from 'react';
import { CalendarIcon } from 'lucide-react';
import type { Deal } from '../../types/crm';
import type { User } from '../../types/org';
import { cn } from '../../utils/cn';
import { formatMoney } from '../../utils/money';
import { Avatar } from '../ui/Avatar';

interface DealCardProps {
  deal: Deal;
  owner: User | undefined;
  overdue: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  dragging: boolean;
}

export function DealCard({ deal, owner, overdue, onOpen, onDragStart, dragging }: DealCardProps) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', deal.id);
        onDragStart();
      }}
      onClick={onOpen}
      className={cn(
        'w-full cursor-grab rounded-md border border-line bg-surface p-3 text-left shadow-card transition-[border-color,opacity] duration-150 hover:border-line-strong active:cursor-grabbing',
        dragging && 'opacity-40'
      )}>
      
      <div className="text-[13px] font-medium leading-snug text-ink">{deal.title}</div>
      <div className="mt-0.5 truncate text-xs text-muted">{deal.company}</div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="tabular text-[13px] font-semibold text-ink">{formatMoney(deal.value, { compact: true })}</span>
        <span className="flex items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 text-[11px]', overdue ? 'font-medium text-critical' : 'text-subtle')}>
            <CalendarIcon className="h-3 w-3" aria-hidden />
            {new Date(deal.expectedClose).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          {owner && <Avatar initials={owner.initials} size="sm" />}
        </span>
      </div>
    </button>);

}