import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsDesktop } from '../lib/useMediaQuery';
import { Sheet } from './Sheet';

/** The laptop side panel element. Screens portal their panel content into it. */
export const PanelSlotContext = createContext<HTMLElement | null>(null);

/**
 * Screen content that sits beside the map: a bottom sheet over the map on phones,
 * the side panel on laptops.
 */
export function Panel({ children, label }: { children: ReactNode; label?: string }) {
  const slot = useContext(PanelSlotContext);
  const desktop = useIsDesktop();
  if (desktop) {
    return slot ? createPortal(<section aria-label={label} className="animate-fade px-5 pt-5 pb-8">{children}</section>, slot) : null;
  }
  return <Sheet label={label}>{children}</Sheet>;
}

/** A full page: covers the map on phones, fills the side panel on laptops. */
export function Page({ children }: { children: ReactNode }) {
  const slot = useContext(PanelSlotContext);
  const desktop = useIsDesktop();
  if (desktop) {
    return slot ? createPortal(<div className="flex min-h-0 flex-1 animate-fade flex-col">{children}</div>, slot) : null;
  }
  return <div className="absolute inset-0 z-20 flex flex-col bg-page pt-[env(safe-area-inset-top)]">{children}</div>;
}
