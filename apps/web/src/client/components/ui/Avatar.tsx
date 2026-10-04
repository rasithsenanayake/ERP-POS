import React from 'react';
import { cn } from '../../utils/cn';

export function Avatar({ initials, size = 'md', className }: {initials: string;size?: 'sm' | 'md';className?: string;}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
        className
      )}
      aria-hidden>
      
      {initials}
    </span>);

}