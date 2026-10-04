import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { FavoritePage, RecentItem } from '../types/system';
import type { PeriodKey } from '../utils/metrics';

export type WidgetId = 'revenue' | 'insights' | 'metrics' | 'branches' | 'topProducts' | 'recentOrders';

export interface WidgetPref {
  id: WidgetId;
  visible: boolean;
}

export const defaultWidgets: WidgetPref[] = [
{ id: 'revenue', visible: true },
{ id: 'insights', visible: true },
{ id: 'metrics', visible: true },
{ id: 'branches', visible: true },
{ id: 'topProducts', visible: true },
{ id: 'recentOrders', visible: true }];


interface PreferencesValue {
  favorites: FavoritePage[];
  toggleFavorite: (page: FavoritePage) => void;
  isFavorite: (path: string) => boolean;
  recent: RecentItem[];
  pushRecent: (item: RecentItem) => void;
  quickCreateUsage: Record<string, number>;
  trackQuickCreate: (id: string) => void;
  widgets: WidgetPref[];
  setWidgets: (widgets: WidgetPref[]) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setupDismissed: boolean;
  setSetupDismissed: (value: boolean) => void;
  period: PeriodKey;
  setPeriod: (value: PeriodKey) => void;
  compare: boolean;
  setCompare: (value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: {children: ReactNode;}) {
  const [favorites, setFavorites] = useLocalStorage<FavoritePage[]>('erp.favorites', [
  { path: '/inventory/ledger', label: 'Stock ledger' }]
  );
  const [recent, setRecent] = useLocalStorage<RecentItem[]>('erp.recent', []);
  const [quickCreateUsage, setUsage] = useLocalStorage<Record<string, number>>('erp.quickCreate', {});
  const [widgets, setWidgetsRaw] = useLocalStorage<WidgetPref[]>('erp.widgets', defaultWidgets);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('erp.sidebarCollapsed', false);
  const [setupDismissed, setSetupDismissed] = useLocalStorage<boolean>('erp.setupDismissed', false);
  const [period, setPeriod] = useLocalStorage<PeriodKey>('erp.period', '30d');
  const [compare, setCompare] = useLocalStorage<boolean>('erp.compare', true);

  const toggleFavorite = useCallback(
    (page: FavoritePage) =>
    setFavorites((prev) => prev.some((f) => f.path === page.path) ? prev.filter((f) => f.path !== page.path) : [...prev, page].slice(-8)),
    [setFavorites]
  );
  const isFavorite = useCallback((path: string) => favorites.some((f) => f.path === path), [favorites]);
  const pushRecent = useCallback(
    (item: RecentItem) => setRecent((prev) => [item, ...prev.filter((r) => !(r.type === item.type && r.id === item.id))].slice(0, 8)),
    [setRecent]
  );
  const trackQuickCreate = useCallback((id: string) => setUsage((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 })), [setUsage]);
  const setWidgets = useCallback((next: WidgetPref[]) => setWidgetsRaw(next), [setWidgetsRaw]);

  // Guard against stale stored layouts that miss newer widgets.
  const safeWidgets = useMemo(() => {
    const known = widgets.filter((w) => defaultWidgets.some((d) => d.id === w.id));
    const missing = defaultWidgets.filter((d) => !known.some((w) => w.id === d.id));
    return [...known, ...missing];
  }, [widgets]);

  const value = useMemo<PreferencesValue>(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      recent,
      pushRecent,
      quickCreateUsage,
      trackQuickCreate,
      widgets: safeWidgets,
      setWidgets,
      sidebarCollapsed,
      setSidebarCollapsed,
      setupDismissed,
      setSetupDismissed,
      period,
      setPeriod,
      compare,
      setCompare
    }),
    [favorites, toggleFavorite, isFavorite, recent, pushRecent, quickCreateUsage, trackQuickCreate, safeWidgets, setWidgets, sidebarCollapsed, setSidebarCollapsed, setupDismissed, setSetupDismissed, period, setPeriod, compare, setCompare]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}