import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ease } from '../../utils/styles';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  dirty?: boolean;
  size?: 'md' | 'lg';
}

export function Drawer({ open, onClose, title, description, children, footer, dirty = false, size = 'md' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const requestClose = () => {
    if (dirty) setConfirmingClose(true);else
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setConfirmingClose(false);
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
      (first ?? panelRef.current)?.focus();
    });
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = original;
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[60]">
          <motion.div
          className="absolute inset-0 bg-ink/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
          onClick={requestClose}
          aria-hidden />
        
          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          initial={{ x: 32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 32, opacity: 0 }}
          transition={{ duration: 0.24, ease }}
          className={cn(
            'absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-drawer focus:outline-none',
            size === 'lg' ? 'max-w-[680px]' : 'max-w-[480px]'
          )}>
          
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
              </div>
              <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink">
              
                <XIcon className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {confirmingClose ?
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-warning-soft px-5 py-3">
                <span className="text-[13px] font-medium text-warning">Discard unsaved changes?</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setConfirmingClose(false)}>
                    Keep editing
                  </Button>
                  <Button size="sm" variant="danger" onClick={onClose}>
                    Discard
                  </Button>
                </div>
              </footer> :

          footer && <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}