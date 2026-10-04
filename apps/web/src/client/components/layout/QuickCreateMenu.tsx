import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon, PlusIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useUi } from '../../contexts/UiContext';
import { quickCreateActions } from '../../data/quickCreate';
import { Button } from '../ui/Button';
import { MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu';
import { Popover } from '../ui/Popover';

export function QuickCreateMenu() {
  const { can, isModuleOn } = useErp();
  const { quickCreateUsage, trackQuickCreate } = usePreferences();
  const { quickCreateOpen, setQuickCreateOpen, openDrawer } = useUi();
  const navigate = useNavigate();

  const allowed = quickCreateActions.
  filter((a) => a.available && (!a.module || isModuleOn(a.module)) && (!a.permission || can(a.permission))).
  sort((a, b) => (quickCreateUsage[b.id] ?? 0) - (quickCreateUsage[a.id] ?? 0));
  const drawers = allowed.filter((a) => a.kind);
  const modules = allowed.filter((a) => a.to);

  return (
    <Popover
      align="end"
      className="w-60"
      open={quickCreateOpen}
      onOpenChange={setQuickCreateOpen}
      trigger={({ toggle }) =>
      <Button variant="primary" icon={PlusIcon} onClick={toggle} aria-label="Create" aria-keyshortcuts="C">
          <span className="hidden sm:inline">Create</span>
        </Button>
      }>
      
      {(close) =>
      <div role="menu">
          <MenuLabel>Create</MenuLabel>
          {drawers.map((action) =>
        <MenuItem
          key={action.id}
          onClick={() => {
            trackQuickCreate(action.id);
            if (action.kind) openDrawer(action.kind);
          }}
          hint={(quickCreateUsage[action.id] ?? 0) > 0 ? 'Frequent' : undefined}>
          
              {action.label}
            </MenuItem>
        )}
          {allowed.length === 0 && <p className="px-2 py-1.5 text-[13px] text-muted">Your role can't create records.</p>}
          {modules.length > 0 &&
        <>
              <MenuSeparator />
              <MenuLabel>In other modules</MenuLabel>
              {modules.map((action) =>
          <MenuItem
            key={action.id}
            icon={ArrowUpRightIcon}
            onClick={() => {
              trackQuickCreate(action.id);
              close();
              navigate(action.to!);
            }}>
            
                  {action.label}
                </MenuItem>
          )}
            </>
        }
        </div>
      }
    </Popover>);

}