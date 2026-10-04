import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { ease } from '../../utils/styles';

interface PopoverProps {
  trigger: (args: {open: boolean;toggle: () => void;}) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  side?: 'bottom' | 'top';
  className?: string;
  wrapperClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ trigger, children, align = 'start', side = 'bottom', className, wrapperClassName, open: controlled, onOpenChange }: PopoverProps) {
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (controlled === undefined) setInternal(value);
  };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', wrapperClassName)}>
      {trigger({ open, toggle: () => setOpen(!open) })}
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.97 }}
          transition={{ duration: 0.16, ease }}
          style={{ transformOrigin: `${side === 'bottom' ? 'top' : 'bottom'} ${align === 'end' ? 'right' : 'left'}` }}
          className={cn(
            'absolute z-50 min-w-[12rem] rounded-lg border border-line bg-surface p-1 shadow-pop',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}>
          
            {children(() => setOpen(false))}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}