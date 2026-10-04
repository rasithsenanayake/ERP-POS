import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useUi } from '../../contexts/UiContext';
import { cn } from '../../utils/cn';
import { ease } from '../../utils/styles';
import { CommandMenu } from './CommandMenu';
import { DrawerHost } from './DrawerHost';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineBanner } from './OfflineBanner';
import { PageSkeleton } from './PageSkeleton';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

export function AppShell() {
  const { sidebarCollapsed } = usePreferences();
  const { commandOpen, setCommandOpen, setQuickCreateOpen, drawer, mobileNavOpen, setMobileNavOpen } = useUi();
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname, setMobileNavOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(!commandOpen);
        return;
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey || drawer || commandOpen) return;
      if (document.querySelector('[role="alertdialog"]')) return;
      if (event.key === '/') {
        const search = document.querySelector<HTMLInputElement>('[data-table-search]');
        if (search) {
          event.preventDefault();
          search.focus();
        }
      } else if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        setQuickCreateOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [commandOpen, drawer, setCommandOpen, setQuickCreateOpen]);

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside
        className={cn(
          'no-print sticky top-0 hidden h-screen shrink-0 border-r border-line bg-sidebar transition-[width] duration-200 ease-out md:block',
          sidebarCollapsed ? 'w-[60px]' : 'w-[236px]'
        )}>
        
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      <AnimatePresence>
        {mobileNavOpen &&
        <div className="fixed inset-0 z-[55] md:hidden">
            <motion.div className="absolute inset-0 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setMobileNavOpen(false)} aria-hidden />
            <motion.aside
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="absolute inset-y-0 left-0 w-[264px] border-r border-line bg-sidebar shadow-pop"
            aria-label="Navigation">
            
              <Sidebar collapsed={false} showCollapseToggle={false} onNavigate={() => setMobileNavOpen(false)} />
            </motion.aside>
          </div>
        }
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <TopBar />
        <div className="no-print flex items-center justify-center gap-2 border-b border-line bg-surface px-4 py-1.5 text-xs text-muted" role="note">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          Prototype preview · changes stay in this browser session
        </div>
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px]">
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <CommandMenu />
      <DrawerHost />
    </div>);

}
