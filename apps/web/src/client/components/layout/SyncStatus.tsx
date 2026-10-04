import React, { useEffect, useState } from 'react';
import { CloudOffIcon, DatabaseIcon, RotateCcwIcon } from 'lucide-react';
import { useBackend } from '../../contexts/BackendContext';
import type { StoreStatus } from '../../utils/backend/store';
import { cn } from '../../utils/cn';

/** Compact save indicator in the top bar. Always tells you whether work is safe. */
export function SyncStatus() {
  const { store } = useBackend();
  const [status, setStatus] = useState<StoreStatus>(() => store.status());
  const [shownSaving, setShownSaving] = useState(false);

  useEffect(() => store.onStatus(setStatus), [store]);

  // Avoid flicker: only show "Saving…" if a save takes longer than a moment.
  useEffect(() => {
    if (status.state !== 'saving') {
      setShownSaving(false);
      return;
    }
    const t = setTimeout(() => setShownSaving(true), 400);
    return () => clearTimeout(t);
  }, [status.state]);

  if (store.kind === 'session' && status.state !== 'error') {
    return (
      <span
        className="hidden h-7 items-center gap-1.5 px-1.5 text-xs text-muted sm:inline-flex"
        title="Demo changes stay in this browser tab's session."
        role="status">
        <DatabaseIcon className="h-3.5 w-3.5" aria-hidden />
        Session only
      </span>
    );
  }

  if (status.state === 'error' || status.state === 'offline') {
    const offline = status.state === 'offline';
    return (
      <button
        type="button"
        onClick={() => void store.flush()}
        title={status.message}
        className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium', offline ? 'bg-warning-soft text-warning' : 'bg-critical-soft text-critical')}>
        
        {offline ? <CloudOffIcon className="h-3.5 w-3.5" aria-hidden /> : <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />}
        <span className="hidden sm:inline">{offline ? 'Offline · changes queued' : "Couldn't save · Retry"}</span>
        <span className="sm:hidden">{offline ? 'Offline' : 'Retry'}</span>
      </button>);

  }

  return (
    <span className="hidden h-7 items-center gap-1.5 px-1.5 text-xs text-muted sm:inline-flex" role="status" aria-live="polite">
      <DatabaseIcon className="h-3.5 w-3.5" aria-hidden />
      {shownSaving ? 'Saving…' : 'Saved'}
    </span>);

}
