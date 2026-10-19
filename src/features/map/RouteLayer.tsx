import type { Marker as LMarker, Polyline as LPolyline } from 'leaflet';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import { journeyById } from '../../data/journeys';
import { bearingAt, slice } from '../../store/geo';
import { navPosition } from '../../store/navigation';
import { routeChoice } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';
import { markFeatureClick } from './mapUi';
import { DestinationMarker } from './MarkerLayers';
import { navIcon } from './markers';

const ROUND = { lineCap: 'round', lineJoin: 'round' } as const;
const ACCENT = '#247dce';
const MUTED = '#5b6b7b';

/** Route comparison: the selected route in accent blue, the other muted (dashed if blocked). */
export function PlanRoutes() {
  const journeyId = useAppStore((s) => s.journeyId);
  const mode = useAppStore((s) => s.mode);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const chosenRouteId = useAppStore((s) => s.chosenRouteId);
  const chooseRoute = useAppStore((s) => s.chooseRoute);
  const journey = journeyById(journeyId);
  const choice = useMemo(() => (journey ? routeChoice(journey, mode, segments, transport) : null), [journey, mode, segments, transport]);
  if (!journey || !choice) return null;

  const selectedId = chosenRouteId ?? choice.recommended?.route.id ?? choice.alternative?.route.id;
  const shown = [choice.original, choice.alternative].filter((e) => !!e);
  // draw the selected route last so it sits on top
  shown.sort((a, b) => Number(a.route.id === selectedId) - Number(b.route.id === selectedId));

  return (
    <>
      {shown.map((e) => {
        const selected = e.route.id === selectedId;
        return (
          <Fragment key={`${e.route.id}-${selected}`}>
            <Polyline positions={e.route.geometry} interactive={false} pathOptions={{ ...ROUND, color: '#ffffff', weight: selected ? 12 : 8, opacity: 1 }} />
            <Polyline
              positions={e.route.geometry}
              interactive={false}
              pathOptions={{
                ...ROUND,
                color: selected ? (e.compromised ? '#9aa7b4' : ACCENT) : MUTED,
                weight: selected ? 7 : 5,
                opacity: selected ? 1 : 0.85,
                dashArray: e.compromised ? '1 9' : undefined,
              }}
            />
            <Polyline
              positions={e.route.geometry}
              pathOptions={{ color: '#000000', weight: 22, opacity: 0 }}
              eventHandlers={{ click: () => { markFeatureClick(); chooseRoute(e.route.id); } }}
            />
          </Fragment>
        );
      })}
      <DestinationMarker position={journey.location} title={journey.destination} />
    </>
  );
}

/** Active navigation: travelled part greyed, remaining in accent, puck moving along it. */
export function NavLayer() {
  const status = useAppStore((s) => s.nav.status);
  const routeKey = useAppStore((s) => `${s.nav.routeId}:${s.nav.rerouteCount}`);
  const journey = journeyById(useAppStore((s) => s.nav.journeyId));
  const doneRef = useRef<LPolyline>(null);
  const aheadRef = useRef<LPolyline>(null);
  const casingRef = useRef<LPolyline>(null);
  const puckRef = useRef<LMarker>(null);

  useEffect(() => {
    const draw = () => {
      const { nav } = useAppStore.getState();
      if (nav.status === 'idle') return;
      const done = slice(nav.geometry, nav.cum, 0, nav.travelled);
      const ahead = slice(nav.geometry, nav.cum, nav.travelled, nav.total);
      doneRef.current?.setLatLngs(done);
      aheadRef.current?.setLatLngs(ahead);
      casingRef.current?.setLatLngs(nav.geometry);
      const pos = navPosition(nav);
      puckRef.current?.setLatLng(pos);
      const arrow = puckRef.current?.getElement()?.querySelector<HTMLElement>('.fp-puck-arrow');
      if (arrow) arrow.style.transform = `rotate(${bearingAt(nav.geometry, nav.cum, nav.travelled)}deg)`;
    };
    draw();
    return useAppStore.subscribe((s, prev) => {
      if (s.nav !== prev.nav) draw();
    });
  }, [routeKey, status]);

  // Stable props per route: Leaflet is updated imperatively above, so re-renders must not reset it.
  const start = useMemo(() => {
    const nav = useAppStore.getState().nav;
    return { geometry: nav.geometry, origin: [nav.geometry[0], nav.geometry[0]] as typeof nav.geometry, pos: navPosition(nav) };
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'idle' || start.geometry.length === 0) return null;
  return (
    <>
      <Polyline ref={casingRef} positions={start.geometry} interactive={false} pathOptions={{ ...ROUND, color: '#ffffff', weight: 12, opacity: 1 }} />
      <Polyline ref={doneRef} positions={start.origin} interactive={false} pathOptions={{ ...ROUND, color: '#9aa7b4', weight: 7 }} />
      <Polyline ref={aheadRef} positions={start.geometry} interactive={false} pathOptions={{ ...ROUND, color: ACCENT, weight: 7 }} />
      {journey && <DestinationMarker position={journey.location} title={journey.destination} />}
      <Marker ref={puckRef} position={start.pos} icon={navIcon()} interactive={false} keyboard={false} zIndexOffset={1000} />
    </>
  );
}
