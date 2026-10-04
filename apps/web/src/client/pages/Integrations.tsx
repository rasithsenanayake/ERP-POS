import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConnectAppDrawer } from '../components/integrations/ConnectAppDrawer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { useErp } from '../contexts/ErpContext';
import { appCategories, integrationApps, webhooks } from '../data/integrations';
import { usePersistentState } from '../hooks/usePersistentState';
import type { IntegrationApp } from '../types/integrations';
import { formatDate } from '../utils/dates';

function Monogram({ text }: {text: string;}) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-xs font-semibold text-ink" aria-hidden>
      {text}
    </span>);

}

export function Integrations() {
  const { can } = useErp();
  const canManage = can('settings.manage');
  const [apps, setApps] = usePersistentState<IntegrationApp[]>('integrations.apps', integrationApps);
  const [connecting, setConnecting] = useState<IntegrationApp | null>(null);
  const [disconnecting, setDisconnecting] = useState<IntegrationApp | null>(null);
  const connected = apps.filter((a) => a.connected);

  return (
    <div>
      <PageHeader title="Apps & integrations" meta={`${connected.length} connected · ${apps.length - connected.length} available`} />
      {!canManage && <p className="mb-3 text-[13px] text-muted">Only owners can connect or disconnect apps.</p>}

      <Panel title="Connected" flush className="mb-6">
        <ul className="mt-2 divide-y divide-line border-t border-line">
          {connected.map((a) =>
          <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Monogram text={a.monogram} />
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  {a.name}
                  <Badge tone="positive" dot>
                    Active
                  </Badge>
                </div>
                <div className="text-xs text-muted">
                  {a.category} · {a.account} · since {a.connectedAt ? formatDate(a.connectedAt) : 'today'}
                </div>
              </div>
              {canManage &&
            <Button size="sm" onClick={() => setDisconnecting(a)}>
                  Disconnect
                </Button>
            }
            </li>
          )}
        </ul>
      </Panel>

      <div className="space-y-6">
        {appCategories.map((cat) => {
          const list = apps.filter((a) => a.category === cat && !a.connected);
          if (list.length === 0) return null;
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2 id={`cat-${cat}`} className="mb-2 text-sm font-semibold text-ink">
                {cat}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((a) =>
                <li key={a.id} className="flex flex-col rounded-lg border border-line bg-surface p-4 shadow-card">
                    <div className="flex items-center gap-3">
                      <Monogram text={a.monogram} />
                      <span className="text-[13px] font-medium text-ink">{a.name}</span>
                    </div>
                    <p className="mt-2 flex-1 text-[13px] text-muted">{a.description}</p>
                    <div className="mt-3">
                      <Button size="sm" disabled={!canManage} onClick={() => setConnecting(a)}>
                        Connect
                      </Button>
                    </div>
                  </li>
                )}
              </ul>
            </section>);

        })}
      </div>

      <Panel title="Webhooks" description="Send events to your own systems as they happen." flush className="mt-6">
        <ul className="mt-2 divide-y divide-line border-t border-line">
          {webhooks.map((w) =>
          <li key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{w.url}</code>
              <span className="text-xs text-muted">{w.events.join(', ')}</span>
              {w.lastDelivery === 'ok' ?
            <span className="inline-flex items-center gap-1 text-xs text-positive">
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden /> Delivering
                </span> :

            <Badge tone="critical">Failing · 14 retries</Badge>
            }
            </li>
          )}
        </ul>
      </Panel>

      <ConnectAppDrawer
        app={connecting}
        onClose={() => setConnecting(null)}
        onConnect={(app, account) => {
          setApps((list) => list.map((a) => a.id === app.id ? { ...a, connected: true, account, connectedAt: new Date().toISOString().slice(0, 10) } : a));
          setConnecting(null);
          toast.success(`${app.name} connected`);
        }} />
      
      <ConfirmationDialog
        open={!!disconnecting}
        title={`Disconnect ${disconnecting?.name}?`}
        description="Anything that depends on this app — checkout payments, courier bookings or messages — stops working immediately."
        confirmLabel="Disconnect"
        onCancel={() => setDisconnecting(null)}
        onConfirm={() => {
          if (disconnecting) {
            setApps((list) => list.map((a) => a.id === disconnecting.id ? { ...a, connected: false, account: null, connectedAt: null } : a));
            toast(`${disconnecting.name} disconnected`);
          }
          setDisconnecting(null);
        }} />
      
    </div>);

}