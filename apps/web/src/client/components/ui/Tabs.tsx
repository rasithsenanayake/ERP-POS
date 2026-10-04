import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { ease } from '../../utils/styles';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  hint?: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

export function Tabs({ items, value, onChange, label }: TabsProps) {
  const layoutId = useId();
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            title={item.hint}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] transition-colors duration-150 disabled:cursor-not-allowed disabled:text-subtle/70',
              active ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            )}>
            
            {item.label}
            {item.count !== undefined && <span className="tabular text-xs text-subtle">{item.count}</span>}
            {item.disabled && <span className="rounded bg-surface-2 px-1 text-[10px] font-medium uppercase tracking-wide text-subtle">Soon</span>}
            {active && <motion.span layoutId={`tab-${layoutId}`} transition={{ duration: 0.2, ease }} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink" />}
          </button>);

      })}
    </div>);

}