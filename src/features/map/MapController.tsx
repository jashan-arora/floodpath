import L, { type LatLngExpression, type Map as LMap } from 'leaflet';
import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { journeyById } from '../../data/journeys';
import { WAYPOINTS } from '../../data/geo.generated';
import { CURRENT_LOCATION } from '../../data/places';
import type { FeatureRef, LatLng } from '../../data/types';
import { navPosition } from '../../store/navigation';
import { useAppStore, type AppState } from '../../store/useAppStore';
import { useMapUi, wasFeatureClick } from './mapUi';

export type MapMode = 'home' | 'plan' | 'nav';

/** The Southbank core: current location, the flooded boulevard and Princes Bridge. */
const HOME_FRAME: LatLng[] = [WAYPOINTS.ORIGIN, WAYPOINTS.STURT_SBB, WAYPOINTS.SBB_STKR, WAYPOINTS.PB_S, WAYPOINTS.CITY_SBB, WAYPOINTS.GRANT_STKR];
let framedNonce = -1;

export function featurePosition(ref: FeatureRef, s: AppState): LatLng | null {
  const mid = (g: LatLng[]) => g[Math.floor(g.length / 2)];
  switch (ref.kind) {
    case 'segment': { const g = s.segments.find((x) => x.id === ref.id)?.geometry; return g ? mid(g) : null; }
    case 'report': return s.reports.find((x) => x.id === ref.id)?.location ?? null;
    case 'sensor': return s.sensors.find((x) => x.id === ref.id)?.location ?? null;
    case 'poi': return s.pois.find((x) => x.id === ref.id)?.location ?? null;
    case 'transport': { const g = s.transport.find((x) => x.id === ref.id)?.geometry; return g ? mid(g) : null; }
  }
}

/** Centre `latlng` in the band left visible between the top overlay and the bottom sheet. */
function centreFor(map: LMap, latlng: LatLngExpression, zoom: number) {
  const { top, bottom } = useMapUi.getState();
  const p = map.project(latlng, zoom).add([0, (bottom - top) / 2]);
  return map.unproject(p, zoom);
}

export function flyToVisible(map: LMap, latlng: LatLngExpression, zoom = Math.max(map.getZoom(), 16)) {
  map.flyTo(centreFor(map, latlng, zoom), zoom, { duration: 0.6 });
}

function fitVisible(map: LMap, points: LatLng[], animate = true, minZoom = 0) {
  const { top, bottom } = useMapUi.getState();
  const bounds = L.latLngBounds(points);
  const fitted = map.getBoundsZoom(bounds, false, L.point(40, top + bottom + 24));
  if (fitted >= minZoom) {
    map.fitBounds(bounds, { paddingTopLeft: [20, top + 12], paddingBottomRight: [20, bottom + 12], maxZoom: 17, animate });
    return;
  }
  // Too spread out to fit legibly: centre on them at a readable zoom instead.
  if (animate) map.flyTo(centreFor(map, bounds.getCenter(), minZoom), minZoom, { duration: 0.6 });
  else map.setView(centreFor(map, bounds.getCenter(), minZoom), minZoom, { animate: false });
}

export function MapController({ mode }: { mode: MapMode }) {
  const select = useAppStore((s) => s.select);
  const focus = useAppStore((s) => s.focus);
  const fit = useAppStore((s) => s.fit);
  const journeyId = useAppStore((s) => s.journeyId);
  const travelMode = useAppStore((s) => s.mode);
  const navRoute = useAppStore((s) => `${s.nav.status}:${s.nav.routeId}:${s.nav.rerouteCount}`);
  const bottomInset = useMapUi((s) => s.bottom);
  const viewNonce = useAppStore((s) => s.viewNonce);

  const map = useMapEvents({
    click: () => {
      if (!wasFeatureClick() && mode === 'home') select(null);
    },
  });

  // The map's container changes size when the tab bar shows or hides.
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(id);
  }, [map, mode]);

  // First load and demo reset: frame Southbank in the band left visible by the overlays.
  useEffect(() => {
    if (mode !== 'home' || framedNonce === viewNonce) return;
    const id = window.setTimeout(() => {
      framedNonce = viewNonce;
      map.invalidateSize();
      fitVisible(map, HOME_FRAME, false);
    }, 250);
    return () => window.clearTimeout(id);
  }, [mode, viewNonce, map]);

  // Fly to a feature when something asks for it (alerts, toasts, shortcuts).
  useEffect(() => {
    if (!focus) return;
    const pos = featurePosition(focus.ref, useAppStore.getState());
    if (pos) window.setTimeout(() => flyToVisible(map, pos), 80);
  }, [focus, map]);

  // Frame a group of features (for example layers just switched on).
  useEffect(() => {
    if (!fit || mode !== 'home') return;
    const id = window.setTimeout(() => fitVisible(map, [...fit.points, CURRENT_LOCATION.position], true, 15), 80);
    return () => window.clearTimeout(id);
  }, [fit, mode, map]);

  // Route comparison: fit the routes being compared.
  useEffect(() => {
    if (mode !== 'plan') return;
    const journey = journeyById(journeyId);
    if (!journey) return;
    const pts = journey.routes.filter((r) => r.mode === travelMode).flatMap((r) => r.geometry);
    const id = window.setTimeout(() => fitVisible(map, [...pts, CURRENT_LOCATION.position, journey.location]), 80);
    return () => window.clearTimeout(id);
  }, [mode, journeyId, travelMode, bottomInset, map]);

  // Navigation: zoom in and follow the puck.
  useEffect(() => {
    if (mode !== 'nav') return;
    const zoom = 17;
    const follow = () => {
      const { nav } = useAppStore.getState();
      if (nav.status === 'idle') return;
      map.setView(centreFor(map, navPosition(nav), zoom), zoom, { animate: false });
    };
    follow();
    return useAppStore.subscribe((s, prev) => {
      if (s.nav.travelled !== prev.nav.travelled || s.nav.geometry !== prev.nav.geometry) follow();
    });
  }, [mode, navRoute, map]);

  return null;
}
