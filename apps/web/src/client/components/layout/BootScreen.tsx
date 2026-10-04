import React from 'react';
import { CloudOffIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface BootScreenProps {
  label: string;
  error?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}

export function BootScreen({ label, error, onRetry, onSignOut }: BootScreenProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm text-center" role={error ? 'alert' : 'status'} aria-live="polite">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white">B</div>
        {error ?
        <>
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-critical-soft text-critical">
              <CloudOffIcon className="h-4 w-4" aria-hidden />
            </div>
            <h1 className="text-base font-semibold text-ink">{label}</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{error}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {onRetry &&
            <Button variant="primary" onClick={onRetry}>
                  Try again
                </Button>
            }
              {onSignOut && <Button onClick={onSignOut}>Sign out</Button>}
            </div>
          </> :

        <>
            <span className="mx-auto mb-3 block h-4 w-4 animate-spin rounded-full border-2 border-accent border-r-transparent" aria-hidden />
            <p className="text-[13px] text-muted">{label}</p>
          </>
        }
      </div>
    </div>);

}
