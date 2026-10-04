import React, { useEffect, useState } from 'react';
import { MailIcon, MessageSquareIcon, PhoneIcon, UsersIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { dealStages } from '../../data/crm';
import type { Deal, DealActivity, DealStage } from '../../types/crm';
import { formatShort } from '../../utils/dates';
import { createId } from '../../utils/ids';
import { formatMoney, parseMoneyInput } from '../../utils/money';
import { inputClass, selectChevron, selectClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface DealDrawerProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSave: (deal: Deal) => void;
  onLog: (deal: Deal) => void;
}

const activityIcons = { call: PhoneIcon, email: MailIcon, meeting: UsersIcon, note: MessageSquareIcon, stage: MessageSquareIcon };

export function DealDrawer({ open, deal, onClose, onSave, onLog }: DealDrawerProps) {
  const { user, state, lookups } = useErp();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [ownerId, setOwnerId] = useState(user.id);
  const [expectedClose, setExpectedClose] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [logKind, setLogKind] = useState<DealActivity['kind']>('call');
  const [logBody, setLogBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(deal?.title ?? '');
    setCompany(deal?.company ?? '');
    setContactName(deal?.contactName ?? '');
    setValue(deal ? String(deal.value / 100) : '');
    setStage(deal?.stage ?? 'lead');
    setOwnerId(deal?.ownerId ?? user.id);
    setExpectedClose(deal?.expectedClose ?? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
    setNextStep(deal?.nextStep ?? '');
    setLogBody('');
    setError('');
    // Reset only when a different deal opens, so logging activity keeps unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal?.id]);

  const people = state.users.filter((u) => u.kind === 'person' && u.role !== 'warehouse_staff');

  const save = () => {
    const cents = parseMoneyInput(value);
    if (!title.trim() || !company.trim()) return setError('Give the deal a title and company.');
    if (cents === null) return setError('Enter the deal value in rupees.');
    const now = new Date().toISOString();
    const activities = [...(deal?.activities ?? [])];
    if (deal && deal.stage !== stage) activities.unshift({ id: createId('act'), kind: 'stage', body: `Moved to ${dealStages.find((s) => s.id === stage)?.label}`, userId: user.id, at: now });
    onSave({
      id: deal?.id ?? createId('deal'),
      title: title.trim(),
      company: company.trim(),
      contactName: contactName.trim(),
      contactPhone: deal?.contactPhone ?? '',
      value: cents,
      stage,
      ownerId,
      expectedClose,
      nextStep: nextStep.trim(),
      activities
    });
  };

  const logActivity = () => {
    if (!deal || !logBody.trim()) return;
    onLog({ ...deal, activities: [{ id: createId('act'), kind: logKind, body: logBody.trim(), userId: user.id, at: new Date().toISOString() }, ...deal.activities] });
    setLogBody('');
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      title={deal ? deal.title : 'New deal'}
      description={deal ? `${deal.company} · ${formatMoney(deal.value)}` : 'Track a sales opportunity through the pipeline.'}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {deal ? 'Save changes' : 'Create deal'}
          </Button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deal title" htmlFor="deal-title" className="sm:col-span-2">
          <input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. 20 laptops for new branch" />
        </Field>
        <Field label="Company" htmlFor="deal-company">
          <input id="deal-company" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Contact" htmlFor="deal-contact" optional>
          <input id="deal-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Value (Rs)" htmlFor="deal-value">
          <input id="deal-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} tabular`} />
        </Field>
        <Field label="Expected close" htmlFor="deal-close">
          <input id="deal-close" type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Stage" htmlFor="deal-stage">
          <select id="deal-stage" value={stage} onChange={(e) => setStage(e.target.value as DealStage)} className={selectClass} style={selectChevron}>
            {dealStages.map((s) =>
            <option key={s.id} value={s.id}>
                {s.label} · {s.probability}%
              </option>
            )}
          </select>
        </Field>
        <Field label="Owner" htmlFor="deal-owner">
          <select id="deal-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={selectClass} style={selectChevron}>
            {people.map((p) =>
            <option key={p.id} value={p.id}>
                {p.name}
              </option>
            )}
          </select>
        </Field>
        <Field label="Next step" htmlFor="deal-next" optional className="sm:col-span-2">
          <input id="deal-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {error &&
      <p className="mt-3 text-xs text-critical" role="alert">
          {error}
        </p>
      }

      {deal &&
      <section className="mt-8" aria-labelledby="deal-activity">
          <h3 id="deal-activity" className="mb-3 text-[13px] font-semibold text-ink">
            Activity
          </h3>
          <div className="rounded-md border border-line-strong p-2">
            <SegmentedControl<DealActivity['kind']>
            label="Activity type"
            value={logKind}
            onChange={setLogKind}
            options={[{ value: 'call', label: 'Call' }, { value: 'email', label: 'Email' }, { value: 'meeting', label: 'Meeting' }, { value: 'note', label: 'Note' }]} />
          
            <textarea aria-label="Activity details" rows={2} value={logBody} onChange={(e) => setLogBody(e.target.value)} className={`${textareaClass} mt-2 border-0 px-1 focus:ring-0`} placeholder="What happened?" />
            <div className="flex justify-end">
              <Button size="sm" disabled={!logBody.trim()} onClick={logActivity}>
                Log activity
              </Button>
            </div>
          </div>
          <ol className="mt-4 space-y-3">
            {deal.activities.length === 0 && <li className="text-[13px] text-muted">No activity logged yet.</li>}
            {deal.activities.map((a) => {
            const Icon = activityIcons[a.kind];
            return (
              <li key={a.id} className="flex gap-3 text-[13px]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-ink">{a.body}</p>
                    <p className="text-xs text-muted">
                      {lookups.usersById.get(a.userId)?.name} · {formatShort(a.at)}
                    </p>
                  </div>
                </li>);

          })}
          </ol>
        </section>
      }
    </Drawer>);

}