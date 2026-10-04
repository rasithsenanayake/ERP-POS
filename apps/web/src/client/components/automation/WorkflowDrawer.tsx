import React, { useEffect, useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { actionOptions, conditionOptions, triggerOptions } from '../../data/automation';
import type { ActionKey, ConditionKey, TriggerKey, Workflow } from '../../types/automation';
import { createId } from '../../utils/ids';
import { centsToInput, parseMoneyInput } from '../../utils/money';
import { inputClass, selectChevron, selectClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

interface WorkflowDrawerProps {
  open: boolean;
  workflow: Workflow | null;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

function Step({ word, children }: {word: string;children: React.ReactNode;}) {
  return (
    <li className="relative pl-14">
      <span className="absolute left-0 top-1.5 w-11 text-right text-[13px] font-semibold text-accent">{word}</span>
      {children}
    </li>);

}

export function WorkflowDrawer({ open, workflow, onClose, onSave, onDelete }: WorkflowDrawerProps) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<TriggerKey>('order.created');
  const [condition, setCondition] = useState<ConditionKey>('none');
  const [threshold, setThreshold] = useState('');
  const [actions, setActions] = useState<ActionKey[]>(['notify_manager']);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(workflow?.name ?? '');
    setTrigger(workflow?.trigger ?? 'order.created');
    setCondition(workflow?.condition ?? 'none');
    setThreshold(workflow?.threshold ? centsToInput(workflow.threshold) : '');
    setActions(workflow?.actions ?? ['notify_manager']);
    setError('');
  }, [open, workflow]);

  const unused = (Object.keys(actionOptions) as ActionKey[]).filter((a) => !actions.includes(a));

  const save = () => {
    if (!name.trim()) return setError('Name the workflow.');
    if (actions.length === 0) return setError('Add at least one action.');
    const cents = condition === 'total_over' ? parseMoneyInput(threshold) : 0;
    if (condition === 'total_over' && !cents) return setError('Enter the order total threshold.');
    onSave({
      id: workflow?.id ?? createId('wf'),
      name: name.trim(),
      trigger,
      condition,
      threshold: cents ?? 0,
      actions,
      enabled: workflow?.enabled ?? true,
      runs: workflow?.runs ?? 0,
      lastRunAt: workflow?.lastRunAt ?? null,
      failures: workflow?.failures ?? 0
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={workflow ? 'Edit workflow' : 'New workflow'}
      description="Workflows run automatically in the background across every module."
      footer={
      <>
          {workflow &&
        <Button variant="ghost" className="mr-auto text-critical" onClick={() => onDelete(workflow.id)}>
              Delete
            </Button>
        }
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {workflow ? 'Save' : 'Create & turn on'}
          </Button>
        </>
      }>
      
      <label htmlFor="wf-name" className="mb-1 block text-[13px] font-medium text-ink">
        Name
      </label>
      <input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Thank VIPs after purchase" />

      <ol className="mt-6 space-y-4">
        <Step word="When">
          <select aria-label="Trigger" value={trigger} onChange={(e) => setTrigger(e.target.value as TriggerKey)} className={selectClass} style={selectChevron}>
            {(Object.keys(triggerOptions) as TriggerKey[]).map((k) =>
            <option key={k} value={k}>
                {triggerOptions[k]}
              </option>
            )}
          </select>
        </Step>
        <Step word="If">
          <select aria-label="Condition" value={condition} onChange={(e) => setCondition(e.target.value as ConditionKey)} className={selectClass} style={selectChevron}>
            {(Object.keys(conditionOptions) as ConditionKey[]).map((k) =>
            <option key={k} value={k}>
                {conditionOptions[k]}
              </option>
            )}
          </select>
          {condition === 'total_over' &&
          <input aria-label="Threshold in rupees" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Rs 100,000" className={`${inputClass} tabular mt-2`} />
          }
        </Step>
        <Step word="Then">
          <ul className="space-y-1.5">
            {actions.map((a, i) =>
            <li key={a} className="flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface-2/60 pl-2.5 pr-1 text-[13px] text-ink">
                <span className="tabular text-xs text-subtle">{i + 1}.</span>
                <span className="flex-1 truncate">{actionOptions[a]}</span>
                <button type="button" aria-label={`Remove ${actionOptions[a]}`} onClick={() => setActions((list) => list.filter((x) => x !== a))} className="rounded p-1 text-muted hover:bg-surface hover:text-ink">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            )}
          </ul>
          {unused.length > 0 &&
          <div className="mt-2 flex items-center gap-2">
              <PlusIcon className="h-4 w-4 text-subtle" aria-hidden />
              <select
              aria-label="Add action"
              value=""
              onChange={(e) => e.target.value && setActions((list) => [...list, e.target.value as ActionKey])}
              className={`${selectClass} border-dashed`}
              style={selectChevron}>
              
                <option value="">Add another action…</option>
                {unused.map((k) =>
              <option key={k} value={k}>
                    {actionOptions[k]}
                  </option>
              )}
              </select>
            </div>
          }
        </Step>
      </ol>
      {error &&
      <p className="mt-4 text-xs text-critical" role="alert">
          {error}
        </p>
      }
    </Drawer>);

}