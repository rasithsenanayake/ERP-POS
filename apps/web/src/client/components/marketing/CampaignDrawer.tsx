import React, { useEffect, useState } from 'react';
import { channelLabels, segmentOptions } from '../../data/marketing';
import type { AudienceSegment, Campaign, CampaignChannel } from '../../types/marketing';
import { createId } from '../../utils/ids';
import { cn } from '../../utils/cn';
import { inputClass, selectChevron, selectClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface CampaignDrawerProps {
  open: boolean;
  segmentCounts: Record<AudienceSegment, number>;
  onClose: () => void;
  onCreate: (campaign: Campaign) => void;
}

const SMS_LIMIT = 160;

export function CampaignDrawer({ open, segmentCounts, onClose, onCreate }: CampaignDrawerProps) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<CampaignChannel>('sms');
  const [segment, setSegment] = useState<AudienceSegment>('vip');
  const [message, setMessage] = useState('');
  const [when, setWhen] = useState<'now' | 'later'>('later');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setMessage('');
    setError('');
    const d = new Date(Date.now() + 86_400_000);
    d.setHours(9, 0, 0, 0);
    setScheduledAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, [open]);

  const over = channel === 'sms' && message.length > SMS_LIMIT;
  const audience = segmentCounts[segment];

  const submit = (status: 'draft' | 'scheduled' | 'sent') => {
    if (!name.trim()) return setError('Name the campaign so your team can find it.');
    if (status !== 'draft' && !message.trim()) return setError('Write the message before scheduling.');
    if (over) return setError(`SMS messages are limited to ${SMS_LIMIT} characters.`);
    if (status !== 'draft' && audience === 0) return setError('This audience has no customers.');
    const sentNow = status === 'sent';
    onCreate({
      id: createId('cmp'),
      name: name.trim(),
      channel,
      segment,
      status,
      message: message.trim(),
      scheduledAt: sentNow ? new Date().toISOString() : new Date(scheduledAt).toISOString(),
      recipients: sentNow ? audience : 0,
      opened: 0,
      clicked: 0,
      revenue: 0
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New campaign"
      dirty={!!name || !!message}
      footer={
      <>
          <Button onClick={() => submit('draft')}>Save draft</Button>
          <Button variant="primary" onClick={() => submit(when === 'now' ? 'sent' : 'scheduled')}>
            {when === 'now' ? `Send to ${audience}` : 'Schedule'}
          </Button>
        </>
      }>
      
      <div className="space-y-4">
        <Field label="Campaign name" htmlFor="cmp-name">
          <input id="cmp-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Avurudu audio sale" />
        </Field>
        <div>
          <div className="mb-1 text-[13px] font-medium text-ink">Channel</div>
          <SegmentedControl<CampaignChannel> label="Channel" value={channel} onChange={setChannel} options={(Object.keys(channelLabels) as CampaignChannel[]).map((c) => ({ value: c, label: channelLabels[c] }))} />
        </div>
        <Field label="Audience" htmlFor="cmp-segment" hint={`${audience} customers will receive this`}>
          <select id="cmp-segment" value={segment} onChange={(e) => setSegment(e.target.value as AudienceSegment)} className={selectClass} style={selectChevron}>
            {segmentOptions.map((s) =>
            <option key={s.value} value={s.value}>
                {s.label} ({segmentCounts[s.value]})
              </option>
            )}
          </select>
        </Field>
        <Field label="Message" htmlFor="cmp-message">
          <textarea id="cmp-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={textareaClass} placeholder="Keep it short and include a clear offer." />
          {channel === 'sms' &&
          <div className={cn('tabular mt-1 text-right text-xs', over ? 'font-medium text-critical' : 'text-muted')}>
              {message.length}/{SMS_LIMIT}
            </div>
          }
        </Field>
        <div>
          <div className="mb-1 text-[13px] font-medium text-ink">When</div>
          <SegmentedControl<'now' | 'later'> label="Send time" value={when} onChange={setWhen} options={[{ value: 'later', label: 'Schedule' }, { value: 'now', label: 'Send now' }]} />
          {when === 'later' && <input aria-label="Scheduled time" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={`${inputClass} mt-2`} />}
        </div>
        {error &&
        <p className="text-xs text-critical" role="alert">
            {error}
          </p>
        }
      </div>
    </Drawer>);

}