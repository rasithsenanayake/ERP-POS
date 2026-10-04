import { apiRequest } from './api';

export type SaveState = 'saved' | 'saving' | 'error' | 'offline';

export interface StoreStatus {
  state: SaveState;
  message?: string;
  lastSavedAt?: string;
  pending: number;
}

export type StoreListener = (key: string, value: unknown, origin?: string) => void;

export interface DataStore {
  kind: 'session' | 'server';
  peek<T>(key: string): T | undefined;
  keys(): string[];
  set(key: string, value: unknown, origin?: string): void;
  subscribe(listener: StoreListener): () => void;
  status(): StoreStatus;
  onStatus(listener: (status: StoreStatus) => void): () => void;
  flush(): Promise<void>;
  clearAll(): Promise<void>;
  dispose(): void;
}

interface ServerDocument {
  key: string;
  data: unknown;
  updatedAt: string;
}

interface InternalStore extends DataStore {
  applyRemote: (key: string, value: unknown) => void;
}

function createStore(initial: Record<string, unknown>, onDispose: () => void): InternalStore {
  const cache = new Map(Object.entries(initial));
  const listeners = new Set<StoreListener>();
  const statusListeners = new Set<(status: StoreStatus) => void>();
  const pending = new Map<string, unknown>();
  const inflightKeys = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inflight: Promise<void> | null = null;
  let current: StoreStatus = { state: 'saved', pending: 0 };

  const setStatus = (state: SaveState, message?: string, lastSavedAt?: string) => {
    current = {
      state,
      message,
      pending: pending.size,
      lastSavedAt: lastSavedAt ?? current.lastSavedAt
    };
    statusListeners.forEach((listener) => listener(current));
  };

  const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), 600);
  };

  const flush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (inflight) await inflight;
    if (!pending.size) return;
    if (isOffline()) {
      setStatus('offline', 'You are offline. Changes will save when you reconnect.');
      return;
    }

    const entries = Array.from(pending.entries());
    pending.clear();
    entries.forEach(([key]) => inflightKeys.add(key));
    setStatus('saving');
    inflight = apiRequest('/workspace/documents', {
      method: 'PUT',
      body: JSON.stringify({ entries: entries.map(([key, data]) => ({ key, data })) })
    }).then(() => {
      setStatus('saved', undefined, new Date().toISOString());
    }).catch((error: unknown) => {
      for (const [key, value] of entries) if (!pending.has(key)) pending.set(key, value);
      setStatus('error', error instanceof Error ? error.message : 'Could not save changes to the server.');
    }).finally(() => {
      entries.forEach(([key]) => inflightKeys.delete(key));
      inflight = null;
      if (pending.size) schedule();
    });
    await inflight;
  };

  const poll = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const documents = await apiRequest<ServerDocument[]>('/workspace/documents');
      documents.forEach(({ key, data }) => store.applyRemote(key, data));
    } catch {
      if (navigator.onLine === false) setStatus('offline', 'You are offline. Changes will sync when you reconnect.');
    }
  };

  const onOnline = () => void flush();
  const onOffline = () => pending.size > 0 && setStatus('offline', 'You are offline. Changes will save when you reconnect.');
  const onUnload = () => { if (pending.size > 0) void flush(); };
  const pollTimer = window.setInterval(() => void poll(), 5000);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  window.addEventListener('pagehide', onUnload);

  const store: InternalStore = {
    kind: 'server',
    peek: <T,>(key: string) => cache.get(key) as T | undefined,
    keys: () => Array.from(cache.keys()),
    set(key, value, origin) {
      cache.set(key, value);
      pending.set(key, value);
      setStatus(isOffline() ? 'offline' : 'saving');
      listeners.forEach((listener) => listener(key, value, origin));
      schedule();
    },
    applyRemote(key, value) {
      if (pending.has(key) || inflightKeys.has(key)) return;
      cache.set(key, value);
      listeners.forEach((listener) => listener(key, value, 'remote'));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    status: () => current,
    onStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    flush,
    async clearAll() {
      if (timer) clearTimeout(timer);
      pending.clear();
      if (inflight) await inflight;
      await apiRequest('/workspace/documents', { method: 'DELETE' });
      cache.clear();
      setStatus('saved', undefined, new Date().toISOString());
    },
    dispose() {
      if (timer) clearTimeout(timer);
      window.clearInterval(pollTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('pagehide', onUnload);
      onDispose();
    }
  };

  return store;
}

export async function createServerStore(): Promise<DataStore> {
  const documents = await apiRequest<ServerDocument[]>('/workspace/documents');
  const initial = Object.fromEntries(documents.map(({ key, data }) => [key, data]));
  return createStore(initial, () => undefined);
}

const SESSION_STORAGE_KEY = 'erp-pos:prototype-session:v1';

/** Browser-only store for the hosted feature showcase. Data ends with this tab's session. */
export function createSessionStore(): DataStore {
  let initial: Record<string, unknown> = {};
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        initial = parsed as Record<string, unknown>;
      }
    }
  } catch {
    // If browser storage is unavailable or invalid, keep the demo usable in memory.
  }

  const cache = new Map(Object.entries(initial));
  const listeners = new Set<StoreListener>();
  const statusListeners = new Set<(status: StoreStatus) => void>();
  let current: StoreStatus = { state: 'saved', pending: 0 };

  const setStatus = (state: SaveState, message?: string) => {
    current = { state, message, pending: 0, lastSavedAt: current.lastSavedAt };
    statusListeners.forEach((listener) => listener(current));
  };

  const flush = async () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Object.fromEntries(cache)));
      setStatus('saved', undefined);
    } catch {
      setStatus('error', 'Changes could not be saved in this browser session.');
    }
  };

  return {
    kind: 'session',
    peek: <T,>(key: string) => cache.get(key) as T | undefined,
    keys: () => Array.from(cache.keys()),
    set(key, value, origin) {
      cache.set(key, value);
      listeners.forEach((listener) => listener(key, value, origin));
      void flush();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    status: () => current,
    onStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    flush,
    async clearAll() {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      cache.clear();
      setStatus('saved', undefined);
    },
    dispose() {}
  };
}
