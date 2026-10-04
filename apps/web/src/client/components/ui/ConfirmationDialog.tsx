import React, { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlertIcon } from 'lucide-react';
import { ease } from '../../utils/styles';
import { Button } from './Button';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  children?: ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmationDialog({ open, title, description, confirmLabel, onConfirm, onCancel, danger = true, children, confirmDisabled }: ConfirmationDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
          className="absolute inset-0 bg-ink/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
          aria-hidden />
        
          <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.2, ease }}
          className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-pop">
          
            <div className="flex gap-3">
              {danger &&
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical">
                  <TriangleAlertIcon className="h-4 w-4" aria-hidden />
                </div>
            }
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                <div className="mt-1 text-[13px] leading-relaxed text-muted">{description}</div>
                {children && <div className="mt-4">{children}</div>}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={onCancel}>Keep it</Button>
              <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={confirmDisabled} autoFocus>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}