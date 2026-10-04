import { useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import type { RecentItem } from '../types/system';

/** Remembers a record in "Recently viewed" (shown in the command palette). */
export function useRecordRecent(item: RecentItem | null): void {
  const { pushRecent } = usePreferences();
  const key = item ? `${item.type}:${item.id}:${item.label}` : null;
  useEffect(() => {
    if (item) pushRecent(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}