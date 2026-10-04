import React from 'react';
import { MenuIcon, SearchIcon } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { BranchPicker } from './BranchPicker';
import { InboxPopover } from './InboxPopover';
import { NotificationPopover } from './NotificationPopover';
import { QuickCreateMenu } from './QuickCreateMenu';
import { SyncStatus } from './SyncStatus';
import { UserMenu } from './UserMenu';

export function TopBar() {
  const { setCommandOpen, setMobileNavOpen } = useUi();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="no-print sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur md:px-5">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 md:hidden">
        
        <MenuIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface-2/60 px-2.5 text-left text-[13px] text-subtle transition-colors duration-150 hover:bg-surface-2 md:max-w-md">
        
        <SearchIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">Search orders, customers, products…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-line bg-surface px-1.5 font-sans text-[11px] text-muted sm:block">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <SyncStatus />
        <BranchPicker />
        <QuickCreateMenu />
        <div className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
        <InboxPopover />
        <NotificationPopover />
        <UserMenu />
      </div>
    </header>);

}