import React from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { cn } from '../../utils/cn';

export function SetupChecklist() {
  const { state } = useErp();
  const { setupDismissed, setSetupDismissed } = usePreferences();
  if (setupDismissed) return null;

  const tasks = [
  { label: 'Business profile', done: Boolean(state.company.registrationNo) },
  { label: 'Branches', done: state.branches.length > 0 },
  { label: 'Tax settings', done: state.company.taxRateBps > 0 },
  { label: 'Products', done: state.products.length > 0 },
  { label: 'Invite team', done: state.users.filter((u) => u.kind === 'person').length > 1 },
  { label: 'Configure POS', done: state.modules.pos },
  { label: 'Payment gateway', done: state.modules.integrations }];

  const done = tasks.filter((t) => t.done).length;

  return (
    <section aria-label="Setup progress" className="mb-5 flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-card lg:flex-row lg:items-center">
      <div className="shrink-0 lg:w-48">
        <div className="text-[13px] font-semibold text-ink">Finish setting up</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${done / tasks.length * 100}%` }} />
          </div>
          <span className="tabular text-xs text-muted">
            {done} of {tasks.length}
          </span>
        </div>
      </div>
      <ul className="flex flex-1 flex-wrap gap-x-4 gap-y-1.5">
        {tasks.map((task) =>
        <li key={task.label} className={cn('flex items-center gap-1.5 text-[13px]', task.done ? 'text-muted' : 'text-ink')}>
            <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', task.done ? 'border-accent bg-accent text-white' : 'border-line-strong')}>
              {task.done && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />}
            </span>
            <span className={cn(task.done && 'line-through decoration-line-strong')}>{task.label}</span>
          </li>
        )}
      </ul>
      <button type="button" onClick={() => setSetupDismissed(true)} aria-label="Dismiss setup checklist" className="self-start rounded p-1 text-subtle hover:bg-surface-2 hover:text-ink lg:self-center">
        <XIcon className="h-4 w-4" />
      </button>
    </section>);

}