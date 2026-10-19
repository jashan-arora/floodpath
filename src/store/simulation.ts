import { useEffect, useState } from 'react';
import { useAppStore } from './useAppStore';

/** Subtle "live" updates every 30 s (CLAUDE.md section 5). Toggled by autoUpdates in the store. */
export const SIM_INTERVAL_MS = 30_000;

export function useSimulation() {
  useEffect(() => {
    const id = window.setInterval(() => useAppStore.getState().simulateTick(), SIM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}

/** Re-render on an interval so "5 min ago" labels stay current. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
