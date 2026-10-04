import React, { useEffect, useState } from 'react';
import { WifiOffIcon } from 'lucide-react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="no-print flex items-center justify-center gap-2 bg-warning-soft px-4 py-1.5 text-xs font-medium text-warning" role="status">
      <WifiOffIcon className="h-3.5 w-3.5" aria-hidden />
      You're offline. Demo changes stay in this browser session.
    </div>);

}
