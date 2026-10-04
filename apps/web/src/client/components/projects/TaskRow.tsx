import React from 'react';
import { CheckIcon, PauseIcon, PlayIcon } from 'lucide-react';
import type { User } from '../../types/org';
import type { ProjectTask, TaskStatus } from '../../types/projects';
import { cn } from '../../utils/cn';
import { formatClock, formatMinutes } from '../../hooks/useTaskTimer';
import { Avatar } from '../ui/Avatar';

interface TaskRowProps {
  task: ProjectTask;
  assignee: User | undefined;
  overdue: boolean;
  timing: boolean;
  elapsedSeconds: number;
  onStatus: (status: TaskStatus) => void;
  onTimer: () => void;
}

export function TaskRow({ task, assignee, overdue, timing, elapsedSeconds, onStatus, onTimer }: TaskRowProps) {
  const done = task.status === 'done';
  return (
    <li className={cn('flex items-center gap-3 px-4 py-2.5', timing && 'bg-accent-soft/50')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark "${task.title}" ${done ? 'not done' : 'done'}`}
        onClick={() => onStatus(done ? 'todo' : 'done')}
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
          done ? 'border-positive bg-positive text-white' : 'border-line-strong hover:border-ink'
        )}>
        
        {done && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[13px]', done ? 'text-muted line-through' : 'text-ink')}>{task.title}</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={cn(overdue && 'font-medium text-critical')}>
            {overdue ? 'Overdue · ' : 'Due '}
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          {task.status === 'doing' && <span className="text-info">· In progress</span>}
        </div>
      </div>
      <span className="tabular hidden w-20 text-right text-xs text-muted sm:block">{timing ? <span className="font-medium text-accent">{formatClock(elapsedSeconds)}</span> : task.loggedMinutes ? formatMinutes(task.loggedMinutes) : '—'}</span>
      {!done &&
      <button
        type="button"
        onClick={onTimer}
        aria-label={timing ? `Stop timer on ${task.title}` : `Start timer on ${task.title}`}
        className={cn('flex h-7 w-7 items-center justify-center rounded-md border transition-colors duration-150', timing ? 'border-accent bg-accent text-white' : 'border-line-strong text-muted hover:text-ink')}>
        
          {timing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
        </button>
      }
      {done && <span className="w-7" />}
      {assignee && <Avatar initials={assignee.initials} size="sm" />}
    </li>);

}