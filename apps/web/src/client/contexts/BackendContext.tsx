import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BootScreen } from '../components/layout/BootScreen';
import { SignIn } from '../pages/auth/SignIn';
import type { RoleKey } from '../types/org';
import { apiRequest, ApiError, apiMessage } from '../utils/backend/api';
import { createServerStore, DataStore } from '../utils/backend/store';

export interface WorkspaceAccount {
  userId: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: RoleKey;
  branchId: string | null;
}

interface BackendValue {
  mode: 'server';
  store: DataStore;
  account: WorkspaceAccount;
  signOut: () => Promise<void>;
}

type Phase =
  | { kind: 'booting'; label: string }
  | { kind: 'signed_out' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; store: DataStore; account: WorkspaceAccount };

const BackendContext = createContext<BackendValue | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'booting', label: 'Connecting to your workspace…' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (phase.kind !== 'ready') return;
    return () => phase.store.dispose();
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let opened: DataStore | null = null;
    setPhase({ kind: 'booting', label: 'Connecting to your workspace…' });

    void (async () => {
      try {
        const account = await apiRequest<WorkspaceAccount>('/auth/me');
        const store = await createServerStore();
        opened = store;
        if (cancelled) {
          store.dispose();
          return;
        }
        setPhase({ kind: 'ready', store, account });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) setPhase({ kind: 'signed_out' });
        else setPhase({ kind: 'error', message: apiMessage(error) });
      }
    })();

    return () => {
      cancelled = true;
      opened?.dispose();
    };
  }, [attempt]);

  const signOut = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setPhase({ kind: 'signed_out' });
  }, []);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const value = useMemo<BackendValue | null>(
    () => phase.kind === 'ready' ? { mode: 'server', store: phase.store, account: phase.account, signOut } : null,
    [phase, signOut]
  );

  if (phase.kind === 'booting') return <BootScreen label={phase.label} />;
  if (phase.kind === 'signed_out') return <SignIn />;
  if (phase.kind === 'error') {
    return <BootScreen label="We couldn't open your workspace" error={phase.message} onRetry={retry} onSignOut={() => void signOut()} />;
  }
  if (!value) return null;
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendValue {
  const context = useContext(BackendContext);
  if (!context) throw new Error('useBackend must be used inside BackendProvider');
  return context;
}
