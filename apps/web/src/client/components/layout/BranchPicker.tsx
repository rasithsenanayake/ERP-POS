import React from 'react';
import { CheckIcon, ChevronDownIcon, LockIcon, StoreIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu';
import { Popover } from '../ui/Popover';

export function BranchPicker() {
  const { state, role, user, branchSelection, setBranchSelection, branchId } = useErp();
  const current = branchId ? state.branches.find((b) => b.id === branchId) : null;

  if (role.scope === 'BRANCH') {
    return (
      <span
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-muted"
        title="Your role is limited to this branch">
        
        <LockIcon className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden max-w-[140px] truncate sm:inline">{current?.name}</span>
      </span>);

  }

  return (
    <Popover
      align="end"
      className="w-60"
      trigger={({ open, toggle }) =>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Choose branch"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink hover:bg-surface-2">
        
          <StoreIcon className="h-4 w-4 text-muted" aria-hidden />
          <span className="hidden max-w-[150px] truncate sm:inline">{current ? current.shortName : 'All branches'}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />
        </button>
      }>
      
      {(close) =>
      <div role="menu">
          <MenuLabel>Viewing data for</MenuLabel>
          <MenuItem
          icon={branchSelection === 'all' ? CheckIcon : undefined}
          onClick={() => {
            setBranchSelection('all');
            close();
          }}
          active={branchSelection === 'all'}>
          
            <span className={branchSelection === 'all' ? '' : 'pl-6'}>All branches</span>
          </MenuItem>
          <MenuSeparator />
          {state.branches.map((branch) =>
        <MenuItem
          key={branch.id}
          icon={branchSelection === branch.id ? CheckIcon : undefined}
          active={branchSelection === branch.id}
          onClick={() => {
            setBranchSelection(branch.id);
            close();
          }}
          hint={branch.city}>
          
              <span className={branchSelection === branch.id ? '' : 'pl-6'}>{branch.name}</span>
            </MenuItem>
        )}
          {role.scope === 'OWN' && <p className="px-2 pb-1 pt-2 text-xs text-muted">You'll only see orders and customers assigned to {user.name.split(' ')[0]}.</p>}
        </div>
      }
    </Popover>);

}