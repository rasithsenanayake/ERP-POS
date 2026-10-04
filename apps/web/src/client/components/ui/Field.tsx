import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, optional, children, className }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1 flex items-baseline justify-between text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {children}
      {error ?
      <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p> :

      hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      }
    </div>);

}