import type { FloodSegment, Journey, RouteOption, Severity, TramDisruption, TravelMode } from '../data/types';

export const severityRank: Record<Severity, number> = { clear: 0, caution: 1, flooded: 2 };

/** CLAUDE.md section 5: a segment blocks a route only if flooded and it affects the selected mode. */
export const segmentBlocks = (s: FloodSegment, mode: TravelMode) =>
  s.severity === 'flooded' && s.affectsModes.includes(mode);

/** Wading through partial flooding is slow: each caution street on a route adds time. */
export const CAUTION_DELAY_MIN = 2;

export interface RouteEvaluation {
  route: RouteOption;
  /** ETA including caution delays, minutes */
  eta: number;
  compromised: boolean;
  blocking: FloodSegment[];
  cautions: FloodSegment[];
  disruptions: TramDisruption[];
  /** flooded segments this route steers around */
  avoided: FloodSegment[];
}

export function evaluateRoute(route: RouteOption, segments: FloodSegment[], transport: TramDisruption[]): RouteEvaluation {
  const find = (id: string) => segments.find((s) => s.id === id);
  const passes = route.blockedSegmentIds.map(find).filter((s): s is FloodSegment => !!s);
  const blocking = passes.filter((s) => segmentBlocks(s, route.mode));
  const cautions = passes.filter((s) => s.severity === 'caution' && s.affectsModes.includes(route.mode));
  const disruptions = (route.disruptionIds ?? [])
    .map((id) => transport.find((t) => t.id === id))
    .filter((t): t is TramDisruption => !!t && t.active);
  const avoided = route.avoidsSegmentIds
    .map(find)
    .filter((s): s is FloodSegment => !!s && segmentBlocks(s, route.mode));
  return {
    route,
    eta: route.etaMinutes + CAUTION_DELAY_MIN * cautions.length,
    compromised: blocking.length > 0 || disruptions.length > 0,
    blocking, cautions, disruptions, avoided,
  };
}

/** Safest first: clear routes, then fewer caution streets, then fastest. */
const rank = (a: RouteEvaluation, b: RouteEvaluation) =>
  Number(a.compromised) - Number(b.compromised) ||
  a.cautions.length - b.cautions.length ||
  a.eta - b.eta;

export interface RouteChoice {
  original: RouteEvaluation | undefined;
  alternative: RouteEvaluation | undefined;
  recommended: RouteEvaluation | undefined;
  all: RouteEvaluation[];
}

export function routeChoice(journey: Journey, mode: TravelMode, segments: FloodSegment[], transport: TramDisruption[]): RouteChoice {
  const all = journey.routes.filter((r) => r.mode === mode).map((r) => evaluateRoute(r, segments, transport));
  const original = all.find((e) => e.route.label === 'Original');
  const alternative = all.filter((e) => e.route.label === 'Alternative').sort(rank)[0];
  const recommended = [original, alternative]
    .filter((e): e is RouteEvaluation => !!e && !e.compromised)
    .sort(rank)[0];
  return { original, alternative, recommended, all };
}

/** Best clear route for a mode, excluding one route id (used for live reroutes). */
export function bestClearRoute(journey: Journey, mode: TravelMode, segments: FloodSegment[], transport: TramDisruption[], exclude?: string) {
  return journey.routes
    .filter((r) => r.mode === mode && r.id !== exclude)
    .map((r) => evaluateRoute(r, segments, transport))
    .filter((e) => !e.compromised)
    .sort(rank)[0];
}

export const metresPerMinute = (r: RouteOption, etaMinutes = r.etaMinutes) => (r.distanceKm * 1000) / etaMinutes;
