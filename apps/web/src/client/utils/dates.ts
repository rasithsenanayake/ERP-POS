import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function formatDate(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy 'at' h:mm a");
}

export function formatShort(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'd MMM, h:mm a');
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, d MMMM yyyy');
}

export function timeAgo(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function daysBetween(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / DAY);
}