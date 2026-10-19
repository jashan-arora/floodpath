import { Link, useLocation } from 'react-router';
import { unreadCount, useAppStore } from '../store/useAppStore';
import { NAV_ITEMS, isNavActive } from './navItems';

/** Phone navigation: Figma's navy tab bar. Forum is replaced by Alerts and the map is the home tab. */
export function TabBar() {
  const unread = useAppStore((s) => unreadCount(s.alerts));
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main" className="relative z-20 shrink-0 rounded-t-[18px] bg-ink pb-[max(env(safe-area-inset-bottom),6px)]">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ to, label, Icon, ...rest }) => {
          const active = isNavActive(to, pathname);
          const primary = 'primary' in rest;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-[62px] flex-col items-center justify-center gap-1 font-display text-[12px] tracking-[0.01em] transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:text-white/85'
                }`}
              >
                {primary ? (
                  <span className={`flex size-[30px] items-center justify-center rounded-full transition ${active ? 'bg-accent text-white' : 'bg-white text-ink'}`}>
                    <Icon size={20} strokeWidth={2.6} aria-hidden />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden />
                    {to === '/alerts' && unread > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flooded px-1 font-sans text-[11px] font-bold text-white ring-2 ring-ink">
                        {unread}
                        <span className="sr-only"> unread</span>
                      </span>
                    )}
                  </span>
                )}
                <span>{label}</span>
                {active && !primary && <span aria-hidden className="absolute top-1.5 h-1 w-1 rounded-full bg-white" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
