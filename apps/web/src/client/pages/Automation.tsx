import React, { useState } from 'react';
import { CheckCircle2Icon, CircleSlashIcon, PlusIcon, WorkflowIcon, XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { WorkflowDrawer } from '../components/automation/WorkflowDrawer';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Switch } from '../components/ui/Switch';
import { useErp } from '../contexts/ErpContext';
import { actionOptions, conditionOptions, triggerOptions, workflowRuns, workflows as seedWorkflows } from '../data/automation';
import { usePersistentState } from '../hooks/usePersistentState';
import type { Workflow } from '../types/automation';
import { cn } from '../utils/cn';
import { formatShort, timeAgo } from '../utils/dates';
import { formatMoney } from '../utils/money';

function describe(w: Workflow): {when: string;ifText: string | null;then: string;} {
  return {
    when: triggerOptions[w.trigger],
    ifText: w.condition === 'none' ? null : w.condition === 'total_over' ? `order total is over ${formatMoney(w.threshold)}` : conditionOptions[w.condition].toLowerCase(),
    then: w.actions.map((a) => actionOptions[a].toLowerCase()).join(', then ')
  };
}

const runIcon = { success: CheckCircle2Icon, failed: XCircleIcon, skipped: CircleSlashIcon };
const runTone = { success: 'text-positive', failed: 'text-critical', skipped: 'text-subtle' };

export function Automation() {
  const { can } = useErp();
  const canManage = can('settings.manage');
  const [workflows, setWorkflows] = usePersistentState<Workflow[]>('automation.workflows', seedWorkflows);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [open, setOpen] = useState(false);
  const active = workflows.filter((w) => w.enabled).length;
  const byId = new Map(workflows.map((w) => [w.id, w]));

  return (
    <div>
      <PageHeader
        title="Automation"
        meta={`${active} of ${workflows.length} workflows running`}
        actions={
        canManage &&
        <Button
          variant="primary"
          icon={PlusIcon}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}>
          
              New workflow
            </Button>

        } />
      
      {!canManage && <p className="mb-3 text-[13px] text-muted">Only owners can create or change workflows.</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel flush>
          {workflows.length === 0 ?
          <EmptyState icon={WorkflowIcon} title="No workflows yet" description="Automate repetitive work across sales, stock and support." /> :

          <ul className="divide-y divide-line">
              {workflows.map((w) => {
              const d = describe(w);
              return (
                <li key={w.id} className="flex items-start gap-4 px-4 py-3.5">
                    <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      setEditing(w);
                      setOpen(true);
                    }}
                    className="min-w-0 flex-1 rounded text-left disabled:cursor-default">
                    
                      <div className={cn('text-[13px] font-medium', w.enabled ? 'text-ink' : 'text-muted')}>{w.name}</div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                        <span className="font-medium text-accent">When</span> {d.when.toLowerCase()}
                        {d.ifText &&
                      <>
                            {' '}
                            <span className="font-medium text-accent">if</span> {d.ifText}
                          </>
                      }{' '}
                        <span className="font-medium text-accent">then</span> {d.then}
                      </p>
                      <p className="tabular mt-1 text-xs text-subtle">
                        {w.runs.toLocaleString()} runs{w.lastRunAt && ` · last ${timeAgo(w.lastRunAt)}`}
                        {w.failures > 0 && <span className="text-critical"> · {w.failures} failed</span>}
                      </p>
                    </button>
                    <Switch
                    checked={w.enabled}
                    disabled={!canManage}
                    label={`${w.name} enabled`}
                    onChange={(enabled) => {
                      setWorkflows((list) => list.map((x) => x.id === w.id ? { ...x, enabled } : x));
                      toast(enabled ? `${w.name} is running` : `${w.name} paused`);
                    }} />
                  
                  </li>);

            })}
            </ul>
          }
        </Panel>

        <Panel title="Recent runs" flush>
          <ol className="mt-2 divide-y divide-line border-t border-line">
            {workflowRuns.map((r) => {
              const Icon = runIcon[r.status];
              return (
                <li key={r.id} className="flex gap-3 px-4 py-2.5">
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', runTone[r.status])} aria-label={r.status} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-ink">{byId.get(r.workflowId)?.name ?? 'Deleted workflow'}</div>
                    <div className="truncate text-xs text-muted">{r.subject}</div>
                    <div className="text-xs text-subtle">
                      {r.detail} · {formatShort(r.at)}
                    </div>
                  </div>
                </li>);

            })}
          </ol>
        </Panel>
      </div>

      <WorkflowDrawer
        open={open}
        workflow={editing}
        onClose={() => setOpen(false)}
        onDelete={(id) => {
          setWorkflows((list) => list.filter((w) => w.id !== id));
          setOpen(false);
          toast('Workflow deleted');
        }}
        onSave={(w) => {
          const exists = workflows.some((x) => x.id === w.id);
          setWorkflows((list) => exists ? list.map((x) => x.id === w.id ? w : x) : [w, ...list]);
          setOpen(false);
          toast.success(exists ? 'Workflow saved' : `${w.name} is now running`);
        }} />
      
    </div>);

}