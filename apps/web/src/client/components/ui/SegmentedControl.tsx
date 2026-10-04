import React from 'react';
import { cn } from '../../utils/cn';

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: {value: T;label: string;}[];
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({ value, onChange, options, label, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-md border border-line-strong bg-surface-2 p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 flex-1 whitespace-nowrap rounded px-2.5 text-[13px] transition-[background-color,color,box-shadow] duration-150',
              active ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(26_26_25/0.1)]' : 'text-muted hover:text-ink'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}