import React from 'react';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { useErp } from '../contexts/ErpContext';
import { moduleDefinitions } from '../data/modules';
import { cn } from '../utils/cn';

export function ModuleSettings() {
  const { state, can, actions } = useErp();
  const canManage = can('settings.manage');

  return (
    <div>
      <PageHeader title="Modules" meta="Turn modules on or off for your organization. Navigation and permissions update instantly." />
      {!canManage && <p className="mb-3 text-[13px] text-muted">Only owners can change modules.</p>}
      <Panel flush>
        <ul className="divide-y divide-line">
          {moduleDefinitions.map((m) => {
            const on = state.modules[m.key];
            const disabled = !canManage || m.required;
            return (
              <li key={m.key} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">{m.name}</span>
                    {m.required && <Badge tone="outline">Required</Badge>}
                    {!m.implemented && <Badge tone="info">Phase {m.phase}</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{m.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${m.name} module`}
                  disabled={disabled}
                  onClick={() => actions.toggleModule(m.key)}
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50',
                    on ? 'bg-accent' : 'bg-line-strong'
                  )}>
                  
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150', on ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                </button>
              </li>);

          })}
        </ul>
      </Panel>
    </div>);

}