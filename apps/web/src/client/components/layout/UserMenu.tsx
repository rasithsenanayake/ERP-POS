import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseIcon, HistoryIcon, SettingsIcon, UsersIcon } from 'lucide-react';
import { useBackend } from '../../contexts/BackendContext';
import { useErp } from '../../contexts/ErpContext';
import { scopeLabels } from '../../utils/permissions';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu';
import { Popover } from '../ui/Popover';

const shortcuts: [string, string][] = [
['⌘ K', 'Search & commands'],
['C', 'Quick create'],
['/', 'Search the current table'],
['Esc', 'Close drawer or dialog']];


export function UserMenu() {
  const { user, role, can } = useErp();
  const { account } = useBackend();
  const navigate = useNavigate();

  const go = (path: string, close: () => void) => {
    navigate(path);
    close();
  };

  return (
    <Popover
      align="end"
      className="w-72"
      trigger={({ open, toggle }) =>
      <button type="button" onClick={toggle} aria-expanded={open} aria-label="Account menu" className="flex items-center gap-2 rounded-md p-0.5 pr-1.5 hover:bg-surface-2">
          <Avatar initials={user.initials} />
          <span className="hidden text-left lg:block">
            <span className="block text-[13px] font-medium leading-tight text-ink">{user.name}</span>
            <span className="block text-[11px] leading-tight text-muted">{role.name}</span>
          </span>
        </button>
      }>
      
      {(close) =>
      <div>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar initials={user.initials} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-ink">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            <Badge tone="accent">{role.name}</Badge>
            <Badge tone="outline">{scopeLabels[role.scope]}</Badge>
          </div>
          <MenuSeparator />
          <MenuItem icon={DatabaseIcon} onClick={() => go('/settings/data', close)} hint="Session only">
            {account.workspaceName}
          </MenuItem>
          {can('team.manage') &&
        <MenuItem icon={UsersIcon} onClick={() => go('/settings/team', close)}>
              Team & roles
            </MenuItem>
        }
          {can('audit.view') &&
        <MenuItem icon={HistoryIcon} onClick={() => go('/settings/audit', close)}>
              Audit log
            </MenuItem>
        }
          <MenuItem icon={SettingsIcon} onClick={() => go('/settings', close)}>
            Settings
          </MenuItem>
          <MenuSeparator />
          <MenuLabel>Keyboard shortcuts</MenuLabel>
          <dl className="px-2 pb-1.5">
            {shortcuts.map(([key, label]) =>
          <div key={key} className="flex items-center justify-between py-0.5 text-xs">
                <dt className="text-muted">{label}</dt>
                <dd>
                  <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans text-[11px] text-ink">{key}</kbd>
                </dd>
              </div>
          )}
          </dl>
        </div>
      }
    </Popover>);

}
