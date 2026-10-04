import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { DrawerKind, DrawerState } from '../types/system';

export type Density = 'comfortable' | 'compact';

interface UiValue {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  drawer: DrawerState | null;
  openDrawer: (kind: DrawerKind, payload?: Record<string, string>) => void;
  closeDrawer: () => void;
  density: Density;
}

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ children, density }: {children: ReactNode;density: Density;}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  const openDrawer = useCallback((kind: DrawerKind, payload?: Record<string, string>) => {
    setCommandOpen(false);
    setQuickCreateOpen(false);
    setDrawer({ kind, payload });
  }, []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const value = useMemo<UiValue>(
    () => ({ commandOpen, setCommandOpen, quickCreateOpen, setQuickCreateOpen, mobileNavOpen, setMobileNavOpen, drawer, openDrawer, closeDrawer, density }),
    [commandOpen, quickCreateOpen, mobileNavOpen, drawer, openDrawer, closeDrawer, density]
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside UiProvider');
  return ctx;
}