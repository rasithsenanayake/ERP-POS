import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import type { LucideIcon } from 'lucide-react';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-[0_1px_0_rgb(0_0_0/0.12),inset_0_1px_0_rgb(255_255_255/0.08)]',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2 shadow-[0_1px_0_rgb(26_26_25/0.05)]',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-critical text-white hover:bg-critical/90 shadow-[0_1px_0_rgb(0_0_0/0.12)]'
};
const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[13px] gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-1.5'
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}, ref) {
  return <button ref={ref} type={type} disabled={disabled || loading} className={cn('inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-[background-color,color,box-shadow,opacity] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], !children && (size === 'sm' ? 'w-7 px-0' : 'w-8 px-0'), className)} {...rest}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
      {IconRight && <IconRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
    </button>;
});
