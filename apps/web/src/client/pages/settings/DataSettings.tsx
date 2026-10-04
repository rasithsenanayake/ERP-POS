import React, { useState } from 'react';
import { DatabaseIcon, DownloadIcon, LogOutIcon, RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { useBackend } from '../../contexts/BackendContext';
import { useErp } from '../../contexts/ErpContext';

export function DataSettings() {
  const { store, account, signOut } = useBackend();
  const { can, state } = useErp();
  const canManage = can('settings.manage');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const downloadBackup = () => {
    const data = Object.fromEntries(store.keys().map((key) => [key, store.peek(key)]));
    const backup = {
      exportedAt: new Date().toISOString(),
      workspace: account.workspaceName,
      data
    };
    const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = `erp-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast.success('Backup downloaded');
  };

  const resetWorkspace = async () => {
    setBusy(true);
    try {
      await store.clearAll();
      window.location.reload();
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : 'Could not reset the workspace. Nothing was deleted.');
    }
  };

  return (
    <div>
      <PageHeader title="Data & backend" meta="Workspace storage, backups, and account access." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-positive-soft text-positive">
                <DatabaseIcon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink">PostgreSQL workspace</h2>
                  <Badge tone="positive" dot>Connected</Badge>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  “{account.workspaceName}” is stored on the private workspace server and shared with its members.
                </p>
                <p className="mt-2 text-xs text-subtle">Signed in as {account.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button icon={LogOutIcon} onClick={() => void signOut()}>Sign out</Button>
            </div>
          </Panel>

          {canManage && (
            <Panel title="Reset workspace" description="Deletes the current workspace data for everyone. Fresh sample data is created after reload.">
              <Button variant="danger" icon={RotateCcwIcon} onClick={() => setConfirmReset(true)}>
                Reset workspace data
              </Button>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Backup" description="Download a JSON copy of this workspace before making major changes.">
            <dl className="mb-4 grid grid-cols-3 gap-3 text-[13px]">
              <div>
                <dt className="text-xs text-muted">Orders</dt>
                <dd className="tabular font-medium text-ink">{state.orders.length.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Customers</dt>
                <dd className="tabular font-medium text-ink">{state.customers.length.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Stock moves</dt>
                <dd className="tabular font-medium text-ink">{state.ledger.length.toLocaleString()}</dd>
              </div>
            </dl>
            <Button icon={DownloadIcon} onClick={downloadBackup}>Download backup</Button>
          </Panel>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmReset}
        title="Reset this workspace for everyone?"
        description="All orders, customers, stock, and module data will be deleted and replaced with fresh sample data. Download a backup first if you may need it."
        confirmLabel={busy ? 'Resetting…' : 'Reset everything'}
        confirmDisabled={busy}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void resetWorkspace()} />
    </div>
  );
}
