import React, { ReactNode, useId } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ease } from '../../utils/styles';
import { Popover } from './Popover';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  id: string;
  label: string;
  options: FilterOption[];
  single?: boolean;
}

interface FilterBarProps {
  views?: {id: string;label: string;count?: number;}[];
  activeView?: string;
  onViewChange?: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: FilterDef[];
  values?: Record<string, string[]>;
  onValuesChange?: (values: Record<string, string[]>) => void;
  right?: ReactNode;
}

export function FilterBar({
  views,
  activeView,
  onViewChange,
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  values = {},
  onValuesChange,
  right
}: FilterBarProps) {
  const layoutId = useId();
  const activeChips = filters.flatMap((f) => (values[f.id] ?? []).map((v) => ({ filter: f, value: v, label: f.options.find((o) => o.value === v)?.label ?? v })));

  const toggleValue = (filter: FilterDef, value: string) => {
    if (!onValuesChange) return;
    const currentValues = values[filter.id] ?? [];
    const next = filter.single ?
    currentValues.includes(value) ?
    [] :
    [value] :
    currentValues.includes(value) ?
    currentValues.filter((v) => v !== value) :
    [...currentValues, value];
    onValuesChange({ ...values, [filter.id]: next });
  };

  return (
    <div className="border-b border-line">
      {views && views.length > 0 &&
      <div className="flex gap-1 overflow-x-auto border-b border-line px-2" role="tablist" aria-label="Saved views">
          {views.map((view) => {
          const active = view.id === activeView;
          return (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onViewChange?.(view.id)}
              className={cn(
                'relative inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] transition-colors duration-150',
                active ? 'font-medium text-ink' : 'text-muted hover:text-ink'
              )}>
              
                {view.label}
                {view.count !== undefined && <span className="tabular text-xs text-subtle">{view.count}</span>}
                {active &&
              <motion.span layoutId={`view-underline-${layoutId}`} transition={{ duration: 0.2, ease }} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink" />
              }
              </button>);

        })}
        </div>
      }
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <label className="relative flex min-w-[180px] flex-1 items-center md:max-w-xs">
          <span className="sr-only">Search</span>
          <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-subtle" aria-hidden />
          <input
            data-table-search
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-line-strong bg-surface pl-8 pr-8 text-[13px] text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          
          {search ?
          <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 text-subtle hover:text-ink" aria-label="Clear search">
              <XIcon className="h-3.5 w-3.5" />
            </button> :

          <kbd className="pointer-events-none absolute right-2 hidden rounded border border-line px-1 font-sans text-[11px] text-subtle md:block">/</kbd>
          }
        </label>
        {filters.map((filter) => {
          const count = (values[filter.id] ?? []).length;
          return (
            <Popover
              key={filter.id}
              className="w-56"
              trigger={({ open, toggle }) =>
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className={cn(
                  'inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[13px] transition-colors duration-150',
                  count ? 'border-accent/40 bg-accent-soft text-accent' : 'border-dashed border-line-strong text-muted hover:bg-surface-2 hover:text-ink'
                )}>
                
                  {filter.label}
                  {count > 0 && <span className="tabular font-medium">· {count}</span>}
                  <ChevronDownIcon className="h-3.5 w-3.5 opacity-70" />
                </button>
              }>
              
              {() =>
              <div role="group" aria-label={filter.label} className="max-h-72 overflow-y-auto">
                  {filter.options.map((option) => {
                  const checked = (values[filter.id] ?? []).includes(option.value);
                  return (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-surface-2">
                        <input
                        type={filter.single ? 'radio' : 'checkbox'}
                        name={filter.id}
                        checked={checked}
                        onChange={() => toggleValue(filter, option.value)}
                        className="h-3.5 w-3.5 accent-accent" />
                      
                        {option.label}
                      </label>);

                })}
                </div>
              }
            </Popover>);

        })}
        {activeChips.length > 0 &&
        <button type="button" onClick={() => onValuesChange?.({})} className="h-8 px-1.5 text-[13px] text-accent hover:underline">
            Clear filters
          </button>
        }
        {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
      </div>
    </div>);

}