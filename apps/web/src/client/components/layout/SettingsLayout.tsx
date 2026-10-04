import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useErp } from '../../contexts/ErpContext';
import { cn } from '../../utils/cn';

const items = [
{ to: '/settings/company', label: 'Company & branches' },
{ to: '/settings/team', label: 'Team & roles' },
{ to: '/settings/modules', label: 'Modules' },
{ to: '/settings/data', label: 'Data & backend' },
{ to: '/settings/audit', label: 'Audit log', permission: 'audit.view' as const }];


export function SettingsLayout() {
  const { can } = useErp();
  return (
    <div>
      <nav aria-label="Settings" className="no-print mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {items.
        filter((item) => !item.permission || can(item.permission)).
        map((item) =>
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
          cn(
            'relative inline-flex h-10 shrink-0 items-center whitespace-nowrap px-2.5 text-[13px] transition-colors duration-150',
            isActive ? 'font-medium text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-ink' : 'text-muted hover:text-ink'
          )
          }>
          
              {item.label}
            </NavLink>
        )}
      </nav>
      <Outlet />
    </div>);

}