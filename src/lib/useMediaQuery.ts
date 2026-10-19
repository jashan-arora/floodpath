import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Laptop layout: navigation rail, side panel and a full-height map. Matches Tailwind's `lg`. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
