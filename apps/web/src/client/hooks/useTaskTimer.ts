import { useEffect, useState } from 'react';

export interface RunningTimer {
  taskId: string;
  startedAt: number;
}

/** A single running timer; ticks once a second while active. */
export function useTaskTimer() {
  const [running, setRunning] = useState<RunningTimer | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedSeconds = running ? Math.max(0, Math.floor((now - running.startedAt) / 1000)) : 0;

  return {
    running,
    elapsedSeconds,
    start: (taskId: string) => {
      setNow(Date.now());
      setRunning({ taskId, startedAt: Date.now() });
    },
    stop: (): RunningTimer | null => {
      const r = running;
      setRunning(null);
      return r;
    }
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}