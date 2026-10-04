import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { createSessionStore, DataStore } from '../utils/backend/store';

export interface WorkspaceAccount {
  workspaceName: string;
}

interface BackendValue {
  store: DataStore;
  account: WorkspaceAccount;
}

const BackendContext = createContext<BackendValue | null>(null);
const demoAccount: WorkspaceAccount = { workspaceName: 'Serendib Retail Group · Demo' };

export function BackendProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createSessionStore());
  const value = useMemo(() => ({ store, account: demoAccount }), [store]);

  useEffect(() => () => store.dispose(), [store]);

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendValue {
  const context = useContext(BackendContext);
  if (!context) throw new Error('useBackend must be used inside BackendProvider');
  return context;
}
