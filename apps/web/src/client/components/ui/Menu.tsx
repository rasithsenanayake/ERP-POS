import React, { ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { LucideIcon } from 'lucide-react';
interface MenuItemProps {
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: ReactNode;
  active?: boolean;
}
export function MenuItem({
  icon: Icon,
  children,
  onClick,
  disabled,
  danger,
  hint,
  active
}: MenuItemProps) {
  return <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-100 focus-visible:bg-surface-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50', danger ? 'text-critical hover:bg-critical-soft' : 'text-ink hover:bg-surface-2', active && 'bg-surface-2 font-medium')}>
      {Icon && <Icon className={cn('h-4 w-4 shrink-0', danger ? 'text-critical' : 'text-muted')} aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 text-xs text-subtle">{hint}</span>}
    </button>;
}
export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" role="separator" />;
}
export function MenuLabel({
  children


}: {children: ReactNode;}) {
  return <div className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted">{children}</div>;
}
