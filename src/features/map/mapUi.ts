import { useEffect, type RefObject } from 'react';
import { create } from 'zustand';

/**
 * How much of the map is covered by floating UI, so fitBounds and fly-to keep
 * features in the visible band between the top bar and the bottom sheet.
 */
interface MapUi {
  top: number;
  bottom: number;
  setInset: (side: 'top' | 'bottom', px: number) => void;
}

export const useMapUi = create<MapUi>()((set) => ({
  top: 120,
  bottom: 200,
  setInset: (side, px) => set({ [side]: Math.round(px) } as Pick<MapUi, typeof side>),
}));

/** Report an overlay's height as a map inset while it is mounted. */
export function useInset(ref: RefObject<HTMLElement | null>, side: 'top' | 'bottom') {
  const setInset = useMapUi((s) => s.setInset);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const parent = el.offsetParent as HTMLElement | null;
      const rect = el.getBoundingClientRect();
      const box = parent?.getBoundingClientRect();
      if (!box) return;
      setInset(side, side === 'top' ? rect.bottom - box.top : box.bottom - rect.top);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      setInset(side, 16);
    };
  }, [ref, side, setInset]);
}

/** Feature clicks also bubble to the map; this lets the map ignore them when deselecting. */
let lastFeatureClick = 0;
export const markFeatureClick = () => {
  lastFeatureClick = Date.now();
};
export const wasFeatureClick = () => Date.now() - lastFeatureClick < 350;
