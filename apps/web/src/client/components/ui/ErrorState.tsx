import React, { ReactNode } from "react";
import { ShieldAlertIcon } from "lucide-react";
import type { LucideIcon } from 'lucide-react';
interface ErrorStateProps {
  title: string;
  description: ReactNode;
  reference?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}
export function ErrorState({
  title,
  description,
  reference,
  icon: Icon = ShieldAlertIcon,
  actions
}: ErrorStateProps) {
  return <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center" role="alert">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-critical-soft text-critical">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-[13px] text-muted">{description}</p>
      {reference && <p className="mt-2 font-mono text-xs text-subtle">Reference {reference}</p>}
      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </div>;
}
