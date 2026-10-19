import type { FloodSegment, LatLng, RouteOption, TravelMode } from '../data/types';
import { cumulative, pointAt, project, slice } from './geo';
import { metresPerMinute } from './selectors';

/** Real time for the marker to cover the starting route. Speed stays constant after a reroute. */
export const NAV_DURATION_MS = 75_000;

export interface NavStep {
  instruction: string;
  at: LatLng;
  /** distance along the navigation line, metres */
  d: number;
}

export interface ReroutePrompt {
  segmentId: string;
  streetName: string;
  toRouteId: string | null;
  etaMinutes: number | null;
  deltaMinutes: number | null;
}

export interface NavState {
  status: 'idle' | 'active' | 'arrived';
  journeyId: string | null;
  mode: TravelMode;
  routeId: string | null;
  geometry: LatLng[];
  cum: number[];
  total: number;
  travelled: number;
  steps: NavStep[];
  /** simulated travel speed for ETAs, metres per minute */
  mpm: number;
  /** animation speed, metres per real millisecond */
  realSpeed: number;
  paused: boolean;
  reroute: ReroutePrompt | null;
  rerouteCount: number;
}

export const IDLE_NAV: NavState = {
  status: 'idle', journeyId: null, mode: 'walk', routeId: null, geometry: [], cum: [0], total: 0,
  travelled: 0, steps: [], mpm: 80, realSpeed: 0, paused: false, reroute: null, rerouteCount: 0,
};

function stepsOn(route: RouteOption, cum: number[], offset = 0): NavStep[] {
  return route.steps.map((s) => ({ ...s, d: project(route.geometry, cum, s.at).along + offset }));
}

export function navFromRoute(journeyId: string, route: RouteOption, etaMinutes = route.etaMinutes): NavState {
  const cum = cumulative(route.geometry);
  const total = cum[cum.length - 1];
  return {
    ...IDLE_NAV,
    status: 'active', journeyId, mode: route.mode, routeId: route.id,
    geometry: route.geometry, cum, total, steps: stepsOn(route, cum),
    mpm: metresPerMinute(route, etaMinutes), realSpeed: total / NAV_DURATION_MS,
  };
}

export const remainingMinutes = (nav: NavState) => (nav.total - nav.travelled) / nav.mpm;
export const navPosition = (nav: NavState) => pointAt(nav.geometry, nav.cum, nav.travelled);

/** How far `target` follows the current line from the start (the shared stretch). */
function branchPoint(nav: NavState, target: RouteOption, tCum: number[]) {
  let dCur = 0;
  let dTarget = 0;
  for (let i = 0; i < target.geometry.length; i++) {
    const p = project(nav.geometry, nav.cum, target.geometry[i]);
    if (p.offset > 6 || p.along + 1 < dCur) break;
    dCur = p.along;
    dTarget = tCum[i];
  }
  return { dCur, dTarget };
}

/**
 * Switch the active navigation onto `target`. If the marker is still on the stretch
 * both routes share, it simply continues. If it has passed the branch, it turns
 * around and heads back to it, which is what a driver or walker would do.
 */
export function rerouteNav(nav: NavState, target: RouteOption, etaMinutes = target.etaMinutes): NavState {
  const tCum = cumulative(target.geometry);
  const tTotal = tCum[tCum.length - 1];
  const { dCur, dTarget } = branchPoint(nav, target, tCum);
  const marker = navPosition(nav);

  let geometry: LatLng[];
  let travelled: number;
  let offset: number;
  const uTurn: NavStep[] = [];
  if (nav.travelled <= dCur + 1) {
    geometry = target.geometry;
    travelled = project(target.geometry, tCum, marker).along;
    offset = 0;
  } else {
    const history = slice(nav.geometry, nav.cum, 0, nav.travelled);
    const back = slice(nav.geometry, nav.cum, dCur, nav.travelled).reverse();
    const ahead = slice(target.geometry, tCum, dTarget, tTotal);
    geometry = [...history, ...back.slice(1), ...ahead.slice(1)];
    travelled = nav.travelled;
    offset = nav.travelled + (nav.travelled - dCur) - dTarget;
    uTurn.push({ instruction: 'Make a U-turn when safe', at: marker, d: travelled + 2 });
  }
  const cum = cumulative(geometry);
  const ahead = stepsOn(target, tCum, offset).filter((s) => s.d > travelled + 2);
  return {
    ...nav,
    routeId: target.id,
    geometry, cum, total: cum[cum.length - 1], travelled,
    steps: [...uTurn, ...ahead],
    mpm: metresPerMinute(target, etaMinutes),
    reroute: null,
    rerouteCount: nav.rerouteCount + 1,
  };
}

/** True if some part of `seg` lies on the navigation line ahead of the marker. */
export function segmentAhead(nav: NavState, seg: FloodSegment): boolean {
  const pts: LatLng[] = [];
  seg.geometry.forEach((p, i) => {
    if (i > 0) {
      const a = seg.geometry[i - 1];
      pts.push([(a[0] + p[0]) / 2, (a[1] + p[1]) / 2]);
    }
    pts.push(p);
  });
  return pts.some((p) => {
    const pr = project(nav.geometry, nav.cum, p);
    return pr.offset < 25 && pr.along > nav.travelled + 5;
  });
}
