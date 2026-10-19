import { Gauge, House, Landmark, Route } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SeverityBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import type { AppAlert } from '../../data/types';
import { timeAgo } from '../../lib/format';
import { useAppStore } from '../../store/useAppStore';

const TYPE = {
  route_disrupted: { Icon: Route, label: 'Saved route' },
  home_risk: { Icon: House, label: 'Near home' },
  sensor: { Icon: Gauge, label: 'Sensor' },
  council: { Icon: Landmark, label: 'City of Melbourne' },
} as const;

const ICON_TONE = {
  flooded: 'bg-flooded-tint text-flooded-ink',
  caution: 'bg-caution-tint text-caution-ink',
  clear: 'bg-safe-tint text-safe',
} as const;

export function AlertItem({ alert, now }: { alert: AppAlert; now: number }) {
  const navigate = useNavigate();
  const markRead = useAppStore((s) => s.markAlertRead);
  const focusOn = useAppStore((s) => s.focusOn);
  const planJourney = useAppStore((s) => s.planJourney);
  const setMode = useAppStore((s) => s.setMode);
  const { Icon, label } = TYPE[alert.type];

  const viewOnMap = () => {
    markRead(alert.id);
    if (alert.target) focusOn(alert.target);
    navigate('/');
  };
  const reroute = () => {
    markRead(alert.id);
    if (!alert.journeyId) return;
    planJourney(alert.journeyId);
    setMode('walk');
    navigate(`/route/${alert.journeyId}`);
  };

  return (
    <article
      onClick={() => markRead(alert.id)}
      className={`relative rounded-card bg-white p-4 shadow-card transition ${alert.read ? '' : 'ring-1 ring-accent/25'}`}
    >
      {!alert.read && <span className="absolute top-4 right-4 size-2.5 rounded-full bg-accent" aria-label="Unread" />}
      <div className="flex gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${ICON_TONE[alert.severity]}`}>
          <Icon size={19} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[12.5px] text-muted">{label}, {timeAgo(alert.createdAt, now)}</p>
          <h2 className={`mt-0.5 font-sans text-[16px] leading-snug text-ink ${alert.read ? 'font-semibold' : 'font-bold'}`}>{alert.title}</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{alert.body}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} label={alert.severity === 'clear' ? 'Information' : undefined} />
          </div>
          {(alert.target || alert.journeyId) && (
            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              {alert.journeyId && <Button size="sm" onClick={reroute}>Reroute</Button>}
              {alert.target && <Button size="sm" variant="secondary" onClick={viewOnMap}>View on map</Button>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
