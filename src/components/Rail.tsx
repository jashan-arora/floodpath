import { Link, useLocation } from 'react-router';
import { unreadCount, useAppStore } from '../store/useAppStore';
import { Logo } from './Logo';
import { NAV_ITEMS, isNavActive } from './navItems';

/** Laptop navigation: the navy tab bar turned into a vertical rail. */
export function Rail() {
  const unread = useAppStore((s) => unreadCount(s.alerts));
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main" className="flex w-[84px] shrink-0 flex-col items-center gap-1 bg-ink py-4">
      <Link to="/" aria-label="FloodPath home" className="mb-4 flex size-11 items-center justify-center rounded-[14px] bg-white/10">
        <Logo size={26} />
      </Link>
      {NAV_ITEMS.map(({ to, label, Icon, ...rest }) => {
        const active = isNavActive(to, pathname);
        const primary = 'primary' in rest;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex w-[68px] flex-col items-center gap-1 rounded-[14px] py-2.5 font-display text-[12px] transition-colors ${
              active ? 'bg-white/12 text-white' : 'text-white/60 hover:bg-white/6 hover:text-white'
            }`}
          >
            {primary ? (
              <span className={`flex size-[30px] items-center justify-center rounded-full ${active ? 'bg-accent text-white' : 'bg-white text-ink'}`}>
                <Icon size={20} strokeWidth={2.6} aria-hidden />
              </span>
            ) : (
              <span className="relative">
                <Icon size={23} strokeWidth={active ? 2.4 : 2} aria-hidden />
                {to === '/alerts' && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flooded px-1 font-sans text-[11px] font-bold text-white ring-2 ring-ink">
                    {unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </span>
            )}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
