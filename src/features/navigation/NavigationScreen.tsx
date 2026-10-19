import { Flag } from 'lucide-react';
import { useRef } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { journeyById } from '../../data/journeys';
import { clockTime, formatDistance } from '../../lib/format';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { remainingMinutes, type NavState } from '../../store/navigation';
import { FILTER_LAYERS, useAppStore } from '../../store/useAppStore';
import { useInset } from '../map/mapUi';
import { InstructionBanner, maneuverIcon } from './InstructionBanner';
import { RerouteBanner } from './RerouteBanner';
import { useNavTicker } from './useNavTicker';

const DOING = { walk: 'Walking', drive: 'Driving', transit: 'Taking transit' } as const;

/** Remaining maneuvers, shown in the laptop side panel. */
function StepList({ nav }: { nav: NavState }) {
  const upcoming = nav.steps.filter((s) => s.d > nav.travelled + 3);
  return (
    <ol className="mt-5 divide-y divide-line overflow-hidden rounded-card bg-white shadow-card">
      {upcoming.map((s, i) => {
        const Icon = maneuverIcon(s.instruction);
        return (
          <li key={`${s.instruction}-${s.d}`} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'bg-tint/60' : ''}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-ink text-white' : 'bg-page text-ink-soft'}`}>
              <Icon size={17} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-snug font-medium">{s.instruction}</span>
            <span className="shrink-0 text-[13px] text-muted tabular-nums">{formatDistance(s.d - nav.travelled)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Simulated navigation (CLAUDE.md 3.2 and 3.3): moving marker, instructions, live reroute. */
export function NavigationScreen() {
  const nav = useAppStore((s) => s.nav);
  const acceptReroute = useAppStore((s) => s.acceptReroute);
  const dismissReroute = useAppStore((s) => s.dismissReroute);
  const endNavigation = useAppStore((s) => s.endNavigation);
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useInset(top, 'top');
  useInset(bottom, 'bottom');
  useNavTicker(nav.status === 'active');

  if (nav.status === 'idle') return <Navigate to="/" replace />;
  const journey = journeyById(nav.journeyId);
  const minutes = remainingMinutes(nav);
  const arrival = new Date(Date.now() + minutes * 60_000);

  const end = () => {
    endNavigation();
    navigate(journey ? `/route/${journey.id}` : '/');
  };
  const done = () => {
    endNavigation();
    navigate('/');
  };
  const findShelter = () => {
    endNavigation();
    const s = useAppStore.getState();
    for (const k of FILTER_LAYERS.services) if (!s.layers[k]) s.toggleLayer(k);
    navigate('/');
  };

  const trip = nav.status === 'arrived' ? (
    <div className="flex items-center gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-safe-tint text-safe">
        <Flag size={24} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[19px] leading-tight font-semibold">You’ve arrived</p>
        <p className="text-[14px] text-muted">{journey?.destination}</p>
      </div>
      <Button onClick={done}>Done</Button>
    </div>
  ) : (
    <>
      <p className="text-[13px] text-muted">
        {DOING[nav.mode]} to {journey?.destination}
        {nav.rerouteCount > 0 && <span className="ml-1.5 rounded-full bg-safe-tint px-2 py-0.5 text-[11px] font-semibold text-safe">Rerouted</span>}
      </p>
      <div className="mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p data-testid="trip-eta" className="font-display text-[32px] leading-none font-semibold tabular-nums">
            {Math.max(1, Math.round(minutes))}
            <span className="ml-1 font-sans text-[15px] font-medium text-muted">min</span>
          </p>
          <p className="mt-1.5 text-[14px] text-muted tabular-nums">
            {formatDistance(nav.total - nav.travelled)} left, arriving {clockTime(arrival)}
          </p>
        </div>
        <Button variant="danger" onClick={end}>End</Button>
      </div>
    </>
  );

  const banners = (
    <>
      {nav.status === 'active' && <InstructionBanner nav={nav} />}
      <RerouteBanner nav={nav} onAccept={acceptReroute} onDismiss={dismissReroute} onShelter={findShelter} />
    </>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div ref={top} className="pointer-events-auto space-y-2 p-3 pt-[max(env(safe-area-inset-top),12px)] lg:w-[440px] lg:p-4">
        {banners}
      </div>
      <div className="flex-1" />
      {desktop ? (
        <Panel label="Trip">
          <section aria-label="Trip">{trip}</section>
          {nav.status === 'active' && <StepList nav={nav} />}
        </Panel>
      ) : (
        <div ref={bottom} className="pointer-events-auto">
          <section aria-label="Trip" className="animate-rise rounded-t-sheet bg-white px-4 pt-4 pb-4 shadow-sheet">{trip}</section>
        </div>
      )}
    </div>
  );
}
