import { ArrowLeft, Navigation, Search } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { AlertBanner } from '../../components/AlertBanner';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Panel } from '../../components/Panel';
import { journeyById } from '../../data/journeys';
import { CURRENT_LOCATION } from '../../data/places';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { routeChoice, type RouteEvaluation } from '../../store/selectors';
import { FILTER_LAYERS, useAppStore } from '../../store/useAppStore';
import { useInset } from '../map/mapUi';
import { ModeSelector } from './ModeSelector';
import { RouteCard } from './RouteCard';

/** Route comparison (CLAUDE.md 3.2): original vs alternative, by mode, then Start navigation. */
export function RoutePlanner() {
  const { journeyId = '' } = useParams();
  const journey = journeyById(journeyId);
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const storeJourney = useAppStore((s) => s.journeyId);
  const planJourney = useAppStore((s) => s.planJourney);
  const mode = useAppStore((s) => s.mode);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const chosenRouteId = useAppStore((s) => s.chosenRouteId);
  const chooseRoute = useAppStore((s) => s.chooseRoute);
  const startNavigation = useAppStore((s) => s.startNavigation);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useInset(top, 'top');
  useInset(bottom, 'bottom');

  useEffect(() => {
    if (journey && storeJourney !== journey.id) planJourney(journey.id);
  }, [journey, storeJourney, planJourney]);

  const choice = useMemo(() => (journey ? routeChoice(journey, mode, segments, transport) : null), [journey, mode, segments, transport]);
  if (!journey || !choice) return <Navigate to="/search" replace />;

  const selectedId = chosenRouteId ?? choice.recommended?.route.id ?? choice.alternative?.route.id;
  const selected = choice.all.find((e) => e.route.id === selectedId);
  const cards = [choice.recommended, choice.original, choice.alternative].filter(
    (e, i, arr): e is RouteEvaluation => !!e && arr.findIndex((x) => x?.route.id === e.route.id) === i,
  );

  const start = () => {
    if (startNavigation()) navigate('/navigate');
  };
  const showShelters = () => {
    const s = useAppStore.getState();
    for (const k of FILTER_LAYERS.services) if (!s.layers[k]) s.toggleLayer(k);
    navigate('/');
  };

  const header = (
    <div className="flex items-center gap-1">
      <IconButton label="Back to map" tone="plain" onClick={() => navigate('/')}>
        <ArrowLeft size={22} />
      </IconButton>
      <div className="min-w-0 flex-1 px-1">
        <p className="truncate text-[12.5px] text-muted">From {CURRENT_LOCATION.label}</p>
        <h1 className="truncate text-[17px] leading-tight font-semibold">To {journey.destination}</h1>
      </div>
      <IconButton label="Change destination" tone="plain" onClick={() => navigate('/search')}>
        <Search size={19} />
      </IconButton>
    </div>
  );

  const body = (
    <>
      <ModeSelector journey={journey} />
      {!choice.recommended && (
        <AlertBanner
          className="mt-3"
          tone="danger"
          title="No flood-free route right now"
          body="Stay somewhere safe or head to a shelter."
          action={<Button size="sm" variant="outline" onClick={showShelters}>Shelters</Button>}
        />
      )}
      <div role="radiogroup" aria-label="Routes" className="mt-3 space-y-2">
        {cards.map((e) => (
          <RouteCard
            key={e.route.id}
            evaluation={e}
            recommended={e.route.id === choice.recommended?.route.id}
            selected={e.route.id === selectedId}
            onSelect={() => chooseRoute(e.route.id)}
          />
        ))}
      </div>
      <Button variant="accent" size="lg" block className="mt-3" disabled={!selected || selected.compromised} onClick={start} icon={<Navigation size={18} aria-hidden />}>
        Start navigation
      </Button>
      {selected?.compromised && (
        <p className="mt-2 text-center text-[13px] text-flooded-ink">This route crosses flooding. Choose a clear route to start.</p>
      )}
    </>
  );

  if (desktop) {
    return (
      <Panel label="Route options">
        <div className="-mx-2 -mt-1 mb-4">{header}</div>
        {body}
      </Panel>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div ref={top} className="pointer-events-auto p-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="rounded-[18px] bg-white/95 p-1.5 shadow-card backdrop-blur">{header}</div>
      </div>
      <div className="flex-1" />
      <div ref={bottom} className="pointer-events-auto">
        <Panel label="Route options">{body}</Panel>
      </div>
    </div>
  );
}
