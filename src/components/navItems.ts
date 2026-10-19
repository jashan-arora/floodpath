import { Bell, House, Map as MapIcon, Plus, User } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Map', Icon: MapIcon },
  { to: '/hub', label: 'Hub', Icon: House },
  { to: '/report', label: 'Report', Icon: Plus, primary: true },
  { to: '/alerts', label: 'Alerts', Icon: Bell },
  { to: '/profile', label: 'Profile', Icon: User },
] as const;

/** Search, route comparison and navigation all belong to the Map tab. */
export function isNavActive(to: string, pathname: string) {
  if (to === '/') return pathname === '/' || /^\/(search|route|navigate)/.test(pathname);
  return pathname === to || pathname.startsWith(`${to}/`);
}
