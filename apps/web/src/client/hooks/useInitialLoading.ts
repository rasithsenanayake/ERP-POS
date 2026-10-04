import { useEffect, useState } from 'react';

/** Shows skeletons briefly on first mount of a page, standing in for the network fetch of a real API. */
export function useInitialLoading(duration = 280): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);
  return loading;
}