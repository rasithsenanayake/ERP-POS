import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CopyIcon, MegaphoneIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignDrawer } from '../components/marketing/CampaignDrawer';
import { Badge, Tone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Switch } from '../components/ui/Switch';
import { Tabs } from '../components/ui/Tabs';
import { useErp } from '../contexts/ErpContext';
import { campaigns as seedCampaigns, channelLabels, loyaltyTiers, promotions as seedPromotions, segmentOptions } from '../data/marketing';
import { usePersistentState } from '../hooks/usePersistentState';
import { useInitialLoading } from '../hooks/useInitialLoading';
import type { AudienceSegment, Campaign, CampaignStatus, Promotion } from '../types/marketing';
import { formatDate, formatShort } from '../utils/dates';
import { formatMoney } from '../utils/money';

const statusMeta: Record<CampaignStatus, {label: string;tone: Tone;}> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  sent: { label: 'Sent', tone: 'positive' }
};

function pct(n: number, d: number): string {
  return d ? `${Math.round(n / d * 100)}%` : '—';
}

export function Marketing() {
  const { scoped } = useErp();
  const navigate = useNavigate();
  const loading = useInitialLoading();
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = usePersistentState<Campaign[]>('marketing.campaigns', seedCampaigns);
  const [promotions, setPromotions] = usePersistentState<Promotion[]>('marketing.promotions', seedPromotions);
  const [creating, setCreating] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const segmentCounts = useMemo(() => {
    const counts = {} as Record<AudienceSegment, number>;
    for (const s of segmentOptions) counts[s.value] = s.tag ? scoped.customers.filter((c) => c.tags.includes(s.tag!)).length : scoped.customers.length;
    return counts;
  }, [scoped.customers]);

  const tiers = useMemo(() => {
    return loyaltyTiers.map((t, i) => {
      const next = loyaltyTiers[i + 1]?.min ?? Infinity;
      const members = scoped.customers.filter((c) => c.loyaltyPoints >= t.min && c.loyaltyPoints < next);
      return { ...t, members: members.length };
    });
  }, [scoped.customers]);
  const topMembers = useMemo(() => [...scoped.customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints).slice(0, 8), [scoped.customers]);
  const totalPoints = scoped.customers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const attributed = campaigns.reduce((s, c) => s + c.revenue, 0);

  const campaignColumns: Column<Campaign>[] = [
  {
    id: 'name',
    header: 'Campaign',
    cell: (c) =>
    <div className="max-w-[260px]">
          <div className="truncate font-medium">{c.name}</div>
          <div className="truncate text-xs text-muted">
            {channelLabels[c.channel]} · {segmentOptions.find((s) => s.value === c.segment)?.label}
          </div>
        </div>,

    sortValue: (c) => c.name
  },
  { id: 'status', header: 'Status', cell: (c) => <Badge tone={statusMeta[c.status].tone} dot>{statusMeta[c.status].label}</Badge>, sortValue: (c) => c.status },
  { id: 'when', header: 'Send date', cell: (c) => <span className="text-muted">{c.status === 'draft' ? '—' : formatShort(c.scheduledAt)}</span>, sortValue: (c) => c.scheduledAt },
  { id: 'recipients', header: 'Recipients', align: 'right', cell: (c) => c.recipients ? c.recipients : <span className="text-subtle">—</span>, sortValue: (c) => c.recipients },
  { id: 'open', header: 'Opened', align: 'right', cell: (c) => <span className="text-muted">{pct(c.opened, c.recipients)}</span> },
  { id: 'click', header: 'Clicked', align: 'right', cell: (c) => <span className="text-muted">{pct(c.clicked, c.recipients)}</span> },
  { id: 'revenue', header: 'Attributed sales', align: 'right', cell: (c) => c.revenue ? formatMoney(c.revenue) : <span className="text-subtle">—</span>, sortValue: (c) => c.revenue }];


  return (
    <div>
      <PageHeader
        title="Marketing"
        meta={`${formatMoney(attributed, { compact: true })} in sales attributed to campaigns in the last 30 days`}
        actions={
        <Button variant="primary" icon={PlusIcon} onClick={() => setCreating(true)}>
            New campaign
          </Button>
        } />
      
      <Tabs
        label="Marketing sections"
        value={tab}
        onChange={setTab}
        items={[
        { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
        { id: 'promotions', label: 'Discount codes', count: promotions.filter((p) => p.active).length },
        { id: 'loyalty', label: 'Loyalty' }]
        } />
      

      <div className="mt-5">
        {tab === 'campaigns' &&
        <section className="rounded-lg border border-line bg-surface shadow-card">
            <DataTable
            label="Campaigns"
            rows={campaigns}
            columns={campaignColumns}
            getRowId={(c) => c.id}
            loading={loading}
            initialSort={{ id: 'when', dir: 'desc' }}
            empty={<EmptyState icon={MegaphoneIcon} title="No campaigns yet" />} />
          
          </section>
        }

        {tab === 'promotions' &&
        <Panel flush>
            <ul className="divide-y divide-line">
              {promotions.map((p) => {
              const expired = p.endsAt < today;
              const exhausted = p.limit !== null && p.uses >= p.limit;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(p.code);
                      toast.success(`Copied ${p.code}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-dashed border-line-strong px-2 py-1 font-mono text-xs font-medium text-ink hover:bg-surface-2"
                    aria-label={`Copy code ${p.code}`}>
                    
                      {p.code}
                      <CopyIcon className="h-3 w-3 text-subtle" aria-hidden />
                    </button>
                    <div className="min-w-[200px] flex-1">
                      <div className="text-[13px] text-ink">{p.description}</div>
                      <div className="text-xs text-muted">
                        {p.kind === 'percent' ? `${p.amount}% off` : `${formatMoney(p.amount)} off`} · {expired ? 'Ended' : 'Ends'} {formatDate(p.endsAt)}
                      </div>
                    </div>
                    <div className="tabular w-28 text-right text-[13px] text-muted">
                      {p.uses} used{p.limit !== null && ` / ${p.limit}`}
                    </div>
                    {expired || exhausted ?
                  <Badge tone="outline">{expired ? 'Expired' : 'Limit reached'}</Badge> :

                  <Switch
                    checked={p.active}
                    label={`${p.code} active`}
                    onChange={(active) => {
                      setPromotions((list) => list.map((x) => x.id === p.id ? { ...x, active } : x));
                      toast(active ? `${p.code} is live at checkout` : `${p.code} paused`);
                    }} />

                  }
                  </li>);

            })}
            </ul>
          </Panel>
        }

        {tab === 'loyalty' &&
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <Panel title="Tiers" description={`${totalPoints.toLocaleString()} points held by members`} flush>
              <ol className="mt-2 divide-y divide-line border-t border-line">
                {tiers.map((t) =>
              <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-ink">
                        {t.label} <span className="font-normal text-muted">· {t.min.toLocaleString()}+ points</span>
                      </div>
                      <div className="text-xs text-muted">{t.perk}</div>
                    </div>
                    <span className="tabular shrink-0 text-[13px] text-ink">{t.members} members</span>
                  </li>
              )}
              </ol>
            </Panel>
            <Panel title="Top members" flush>
              <ul className="mt-2 divide-y divide-line border-t border-line">
                {topMembers.map((c) => {
                const tier = [...loyaltyTiers].reverse().find((t) => c.loyaltyPoints >= t.min)!;
                return (
                  <li key={c.id}>
                      <button type="button" onClick={() => navigate(`/customers/${c.id}`)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-2/60">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                          <span className="block truncate text-xs text-muted">{c.city}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <Badge tone={tier.id === 'gold' ? 'warning' : tier.id === 'silver' ? 'info' : 'neutral'}>{tier.label}</Badge>
                          <span className="tabular w-16 text-right text-[13px] text-ink">{c.loyaltyPoints.toLocaleString()}</span>
                        </span>
                      </button>
                    </li>);

              })}
              </ul>
            </Panel>
          </div>
        }
      </div>

      <CampaignDrawer
        open={creating}
        segmentCounts={segmentCounts}
        onClose={() => setCreating(false)}
        onCreate={(c) => {
          setCampaigns((list) => [c, ...list]);
          setCreating(false);
          toast.success(c.status === 'sent' ? `Sending to ${c.recipients} customers` : c.status === 'scheduled' ? `${c.name} scheduled for ${formatShort(c.scheduledAt)}` : 'Draft saved');
        }} />
      
    </div>);

}