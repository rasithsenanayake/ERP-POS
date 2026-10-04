import React, { useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DealCard } from '../components/crm/DealCard';
import { DealDrawer } from '../components/crm/DealDrawer';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useErp } from '../contexts/ErpContext';
import { deals as seedDeals, dealStages } from '../data/crm';
import { usePersistentState } from '../hooks/usePersistentState';
import type { Deal, DealStage } from '../types/crm';
import { cn } from '../utils/cn';
import { formatMoney } from '../utils/money';

type Owner = 'all' | 'mine';

export function Crm() {
  const { user, lookups, role } = useErp();
  const [deals, setDeals] = usePersistentState<Deal[]>('crm.deals', seedDeals);
  const [owner, setOwner] = useState<Owner>(role.scope === 'OWN' ? 'mine' : 'all');
  const [editing, setEditing] = useState<Deal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [showLost, setShowLost] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => deals.filter((d) => owner === 'all' || d.ownerId === user.id), [deals, owner, user.id]);
  const open = visible.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const pipeline = open.reduce((s, d) => s + d.value, 0);
  const weighted = open.reduce((s, d) => s + Math.round(d.value * dealStages.find((x) => x.id === d.stage)!.probability / 100), 0);
  const won = visible.filter((d) => d.stage === 'won');
  const closed = visible.filter((d) => d.stage === 'won' || d.stage === 'lost').length;
  const winRate = closed ? Math.round(won.length / closed * 100) : null;
  const columns = dealStages.filter((s) => s.id !== 'lost' || showLost);

  const moveDeal = (id: string, stage: DealStage) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    const label = dealStages.find((s) => s.id === stage)!.label;
    setDeals((list) =>
    list.map((d) => d.id === id ? { ...d, stage, activities: [{ id: `${id}-${Date.now()}`, kind: 'stage', body: `Moved to ${label}`, userId: user.id, at: new Date().toISOString() }, ...d.activities] } : d)
    );
    toast.success(`${deal.title} → ${label}`);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        meta="Business deals from first contact to close."
        actions={
        <>
            <SegmentedControl<Owner> label="Owner" value={owner} onChange={setOwner} options={[{ value: 'all', label: 'All deals' }, { value: 'mine', label: 'My deals' }]} />
            <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}>
            
              New deal
            </Button>
          </>
        } />
      

      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="text-[13px] text-muted">Weighted forecast</dt>
          <dd className="tabular text-2xl font-semibold tracking-[-0.01em] text-ink">{formatMoney(weighted, { compact: true })}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Open pipeline</dt>
          <dd className="tabular mt-1 text-lg font-semibold text-ink">
            {formatMoney(pipeline, { compact: true })} <span className="text-[13px] font-normal text-muted">· {open.length} deals</span>
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Won</dt>
          <dd className="tabular mt-1 text-lg font-semibold text-ink">{formatMoney(won.reduce((s, d) => s + d.value, 0), { compact: true })}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Win rate</dt>
          <dd className="tabular mt-1 text-lg font-semibold text-ink">{winRate === null ? '—' : `${winRate}%`}</dd>
        </div>
        <div className="ml-auto self-end">
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" checked={showLost} onChange={(e) => setShowLost(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
            Show lost deals
          </label>
        </div>
      </dl>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div className="grid min-w-[960px] gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((stage) => {
            const stageDeals = visible.filter((d) => d.stage === stage.id);
            const total = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <section
                key={stage.id}
                aria-label={`${stage.label} stage`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(stage.id);
                }}
                onDragLeave={() => setOverStage((s) => s === stage.id ? null : s)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) moveDeal(id, stage.id);
                  setDragId(null);
                  setOverStage(null);
                }}
                className={cn('flex min-h-[420px] flex-col rounded-lg bg-surface-2/70 p-2 transition-colors duration-150', overStage === stage.id && dragId && 'bg-accent-soft')}>
                
                <header className="mb-2 px-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[13px] font-semibold text-ink">{stage.label}</h2>
                    <span className="tabular text-xs text-muted">{stageDeals.length}</span>
                  </div>
                  <div className="tabular text-xs text-muted">
                    {formatMoney(total, { compact: true })}
                    {stage.id !== 'won' && stage.id !== 'lost' && ` · ${stage.probability}%`}
                  </div>
                </header>
                <ul className="flex flex-1 flex-col gap-2">
                  {stageDeals.map((deal) =>
                  <li key={deal.id}>
                      <DealCard
                      deal={deal}
                      owner={lookups.usersById.get(deal.ownerId)}
                      overdue={deal.stage !== 'won' && deal.stage !== 'lost' && deal.expectedClose < today}
                      dragging={dragId === deal.id}
                      onDragStart={() => setDragId(deal.id)}
                      onOpen={() => {
                        setEditing(deal);
                        setDrawerOpen(true);
                      }} />
                    
                    </li>
                  )}
                  {stageDeals.length === 0 && <li className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-xs text-subtle">Drop deals here</li>}
                </ul>
              </section>);

          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">Drag cards between stages, or open a deal to change its stage and log activity.</p>

      <DealDrawer
        open={drawerOpen}
        deal={editing}
        onClose={() => setDrawerOpen(false)}
        onLog={(deal) => {
          setDeals((list) => list.map((d) => d.id === deal.id ? deal : d));
          setEditing(deal);
          toast.success('Activity logged');
        }}
        onSave={(deal) => {
          const exists = deals.some((d) => d.id === deal.id);
          setDeals((list) => exists ? list.map((d) => d.id === deal.id ? deal : d) : [deal, ...list]);
          setDrawerOpen(false);
          toast.success(exists ? 'Deal updated' : `Deal created for ${deal.company}`);
        }} />
      
    </div>);

}