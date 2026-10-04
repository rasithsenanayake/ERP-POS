import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CheckIcon, ChevronsUpDownIcon, HistoryIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, SettingsIcon, StarIcon, StoreIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { navSections, NavItem, primaryNav } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu';
import { Popover } from '../ui/Popover';

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}

function isActive(item: NavItem, pathname: string): boolean {
  if (item.children) return item.children.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`)) || pathname.startsWith(item.to);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function Sidebar({ collapsed, onNavigate, showCollapseToggle = true }: SidebarProps) {
  const { state, isModuleOn, can } = useErp();
  const { favorites, setSidebarCollapsed } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const primary = primaryNav.filter((item) => !item.module || isModuleOn(item.module));
  const sections = navSections.
  map((section) => ({ ...section, items: section.items.filter((item) => !item.module || isModuleOn(item.module)) })).
  filter((section) => section.items.length > 0);

  const itemClass = (active: boolean) =>
  cn(
    'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors duration-150',
    active ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(26_26_25/0.08)]' : 'text-muted hover:bg-surface/70 hover:text-ink',
    collapsed && 'justify-center px-0'
  );

  return (
    <div className="flex h-full flex-col">
      <div className={cn('px-2 pb-2 pt-3', collapsed && 'px-1.5')}>
        <Popover
          className="w-64"
          trigger={({ open, toggle }) =>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="Switch company"
            className={cn('flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-surface/70', collapsed && 'justify-center')}>
            
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[13px] font-semibold text-white">{state.company.name.trim()[0]?.toUpperCase() ?? 'B'}</span>
              {!collapsed &&
            <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{state.company.name.replace(/\s*\((pvt|private)\)\s*(ltd|limited)\.?$/i, '')}</span>
                    <span className="block truncate text-[11px] text-muted">{state.organization.name}</span>
                  </span>
                  <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-subtle" />
                </>
            }
            </button>
          }>
          
          {(close) =>
          <div>
              <MenuLabel>{state.organization.name}</MenuLabel>
              <MenuItem icon={CheckIcon} active onClick={close} hint="LKR">
                {state.company.name}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
              icon={StoreIcon}
              onClick={() => {
                navigate('/settings/company');
                onNavigate?.();
                close();
              }}
              hint={`${state.branches.length}`}>
              
                Company & branches
              </MenuItem>
              {can('team.manage') &&
            <MenuItem
              icon={PlusIcon}
              onClick={() => {
                navigate('/settings/team');
                onNavigate?.();
                close();
              }}>
              
                  Invite teammates
                </MenuItem>
            }
            </div>
          }
        </Popover>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Main">
        {favorites.length > 0 && !collapsed &&
        <div className="mb-3">
            <div className="px-2 pb-1 text-[11px] font-medium text-subtle">Favorites</div>
            <ul className="space-y-px">
              {favorites.map((fav) =>
            <li key={fav.path}>
                  <NavLink to={fav.path} onClick={onNavigate} className={({ isActive: a }) => itemClass(a)}>
                    <StarIcon className="h-3.5 w-3.5 shrink-0 fill-current text-subtle" aria-hidden />
                    <span className="truncate">{fav.label}</span>
                  </NavLink>
                </li>
            )}
            </ul>
          </div>
        }

        <ul className="space-y-px">
          {primary.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink to={item.to} onClick={onNavigate} className={itemClass(active && (!item.children || collapsed))} title={collapsed ? item.label : undefined}>
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-ink' : 'text-muted group-hover:text-ink')} aria-hidden />
                  {!collapsed && <span className={cn('truncate', active && 'font-medium text-ink')}>{item.label}</span>}
                </NavLink>
                {item.children && active && !collapsed &&
                <ul className="mb-1 ml-[18px] mt-px space-y-px border-l border-line pl-2.5">
                    {item.children.map((child) => {
                    const childActive = pathname === child.to || child.to !== '/inventory' && pathname.startsWith(`${child.to}/`);
                    return (
                      <li key={child.to}>
                          <NavLink to={child.to} end onClick={onNavigate} className={itemClass(childActive)}>
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        </li>);

                  })}
                  </ul>
                }
              </li>);

          })}
        </ul>

        {sections.map((section) =>
        <div key={section.label} className="mt-4">
            {!collapsed && <div className="px-2 pb-1 text-[11px] font-medium text-subtle">{section.label}</div>}
            {collapsed && <div className="mx-2 mb-2 h-px bg-line" />}
            <ul className="space-y-px">
              {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item, pathname);
              return (
                <li key={item.id}>
                    <NavLink to={item.to} onClick={onNavigate} className={itemClass(active)} title={collapsed ? item.label : undefined}>
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-ink' : 'text-muted group-hover:text-ink')} aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>);

            })}
            </ul>
          </div>
        )}
      </nav>

      <div className="space-y-px border-t border-line px-2 py-2">
        {can('audit.view') &&
        <NavLink to="/settings/audit" onClick={onNavigate} className={({ isActive: a }) => itemClass(a)} title={collapsed ? 'Activity log' : undefined}>
            <HistoryIcon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span>Activity log</span>}
          </NavLink>
        }
        <NavLink to="/settings" onClick={onNavigate} className={() => itemClass(pathname.startsWith('/settings') && pathname !== '/settings/audit')} title={collapsed ? 'Settings' : undefined}>
          <SettingsIcon className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {showCollapseToggle &&
        <button type="button" onClick={() => setSidebarCollapsed(!collapsed)} className={cn(itemClass(false), 'w-full')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpenIcon className="h-4 w-4 shrink-0" /> : <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        }
      </div>
    </div>);

}
