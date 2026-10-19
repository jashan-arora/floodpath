import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

/** Drives the simulated marker with requestAnimationFrame while navigation is active. */
export function useNavTicker(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      useAppStore.getState().tickNavigation(Math.min(100, t - last));
      last = t;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
