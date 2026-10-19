import { create } from 'zustand';
import { journeyById } from '../data/journeys';
import { createSeed, type SeedData } from '../data/seed';
import type {
  AppAlert, FeatureRef, FloodSegment, LatLng, PointOfInterest, ReportKind, ResidentReport, Severity, TravelMode,
} from '../data/types';
import { IDLE_NAV, navFromRoute, remainingMinutes, rerouteNav, segmentAhead, type NavState } from './navigation';
import { bestClearRoute, evaluateRoute, routeChoice, segmentBlocks, severityRank } from './selectors';

// ------------------------------------------------------------------ layers

export type LayerKey =
  | 'floodZones' | 'reports' | 'sensors' | 'transport'
  | 'shelters' | 'medical' | 'power' | 'water' | 'repairCrews';

export const LAYER_KEYS: LayerKey[] = ['floodZones', 'reports', 'sensors', 'transport', 'shelters', 'medical', 'power', 'water', 'repairCrews'];

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  floodZones: true, reports: true, sensors: false, transport: false,
  shelters: false, medical: false, power: false, water: false, repairCrews: false,
};

/** Figma's quick-filter chips: each shows one group on its own. */
export type QuickFilter = 'flooding' | 'roads' | 'transport' | 'services';
export const FILTER_LAYERS: Record<QuickFilter, LayerKey[]> = {
  flooding: ['reports', 'sensors'],
  roads: ['floodZones'],
  transport: ['transport'],
  services: ['shelters', 'medical', 'power', 'water', 'repairCrews'],
};

export function activeQuickFilter(layers: Record<LayerKey, boolean>): QuickFilter | null {
  for (const [f, keys] of Object.entries(FILTER_LAYERS) as [QuickFilter, LayerKey[]][]) {
    if (LAYER_KEYS.every((k) => layers[k] === keys.includes(k))) return f;
  }
  return null;
}

export const POI_LAYER: Record<PointOfInterest['type'], LayerKey> = {
  shelter: 'shelters', medical: 'medical', power: 'power', water: 'water', repair_crew: 'repairCrews',
};

// ------------------------------------------------------------------ toasts

export interface Toast {
  id: number;
  tone: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  body?: string;
  action?: { label: string; to?: string; focus?: FeatureRef };
}

// ------------------------------------------------------------------ state

export interface ReportInput {
  kind: ReportKind;
  severity: Exclude<Severity, 'clear'>;
  streetName: string;
  segmentId?: string;
  location: LatLng;
  photoUrl?: string;
  note?: string;
}

export interface AppState extends SeedData {
  layers: Record<LayerKey, boolean>;
  selected: FeatureRef | null;
  /** a request for the map to fly to a feature; nonce makes repeat requests distinct */
  focus: { ref: FeatureRef; nonce: number } | null;
  /** a request for the map to frame a set of points */
  fit: { points: LatLng[]; nonce: number } | null;
  /** a segment that just flooded, pulsed once on the map */
  flash: { segmentId: string; nonce: number } | null;
  journeyId: string | null;
  mode: TravelMode;
  chosenRouteId: string | null;
  nav: NavState;
  autoUpdates: boolean;
  lastUpdatedAt: string;
  tick: number;
  toasts: Toast[];
  demoOpen: boolean;
  /** bumps when the map should re-frame Southbank (first load, demo reset) */
  viewNonce: number;

  select: (ref: FeatureRef | null) => void;
  focusOn: (ref: FeatureRef) => void;
  fitTo: (points: LatLng[]) => void;
  toggleLayer: (key: LayerKey) => void;
  applyQuickFilter: (f: QuickFilter) => void;
  showLayers: (keys: LayerKey[]) => void;
  planJourney: (journeyId: string) => void;
  setMode: (mode: TravelMode) => void;
  chooseRoute: (routeId: string) => void;
  startNavigation: () => boolean;
  tickNavigation: (dtMs: number) => void;
  setNavPaused: (paused: boolean) => void;
  acceptReroute: () => void;
  dismissReroute: () => void;
  endNavigation: () => void;
  submitReport: (input: ReportInput) => string;
  verifyReport: (id: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  triggerFlooding: (segmentId: string) => void;
  triggerSensorAlert: (sensorId: string) => void;
  clearAllFlooding: () => void;
  resetDemo: () => void;
  setAutoUpdates: (on: boolean) => void;
  simulateTick: () => void;
  setDemoOpen: (open: boolean) => void;
}

// ------------------------------------------------------------------ helpers

export const VERIFY_DELAY_MS = 4000;
const timers = new Set<number>();
let toastId = 0;
let nonce = 0;
const nowIso = () => new Date().toISOString();

function layerFor(ref: FeatureRef, s: SeedData): LayerKey {
  switch (ref.kind) {
    case 'segment': return 'floodZones';
    case 'report': return 'reports';
    case 'sensor': return 'sensors';
    case 'transport': return 'transport';
    case 'poi': return POI_LAYER[s.pois.find((p) => p.id === ref.id)?.type ?? 'shelter'];
  }
}

/** If an active navigation now runs into a flooded street ahead, prepare the reroute prompt. */
function reroutePromptFor(s: AppState): NavState | null {
  const { nav } = s;
  if (nav.status !== 'active' || nav.reroute) return null;
  const journey = journeyById(nav.journeyId);
  const route = journey?.routes.find((r) => r.id === nav.routeId);
  if (!journey || !route) return null;
  const hit = route.blockedSegmentIds
    .map((id) => s.segments.find((g) => g.id === id))
    .find((g): g is FloodSegment => !!g && segmentBlocks(g, nav.mode) && segmentAhead(nav, g));
  if (!hit) return null;
  const best = bestClearRoute(journey, nav.mode, s.segments, s.transport, route.id);
  let etaMinutes: number | null = null;
  let deltaMinutes: number | null = null;
  if (best) {
    etaMinutes = remainingMinutes(rerouteNav(nav, best.route, best.eta));
    deltaMinutes = Math.round(etaMinutes) - Math.round(remainingMinutes(nav));
  }
  return { ...nav, reroute: { segmentId: hit.id, streetName: hit.streetName, toRouteId: best?.route.id ?? null, etaMinutes, deltaMinutes } };
}

/** Does flooding on this segment affect the saved route or the active navigation? */
function affectsUserRoute(s: AppState, segmentId: string): boolean {
  if (s.nav.status === 'active') {
    const r = journeyById(s.nav.journeyId)?.routes.find((x) => x.id === s.nav.routeId);
    if (r?.blockedSegmentIds.includes(segmentId)) return true;
  }
  return s.profile.savedRoutes.some((jid) =>
    journeyById(jid)?.routes.some((r) => r.mode === 'walk' && r.label === 'Original' && r.blockedSegmentIds.includes(segmentId)),
  );
}

function initialState(): Omit<AppState, keyof Actions> {
  return {
    ...createSeed(),
    layers: { ...DEFAULT_LAYERS },
    selected: null,
    focus: null,
    fit: null,
    flash: null,
    journeyId: null,
    mode: 'walk',
    chosenRouteId: null,
    nav: IDLE_NAV,
    autoUpdates: true,
    lastUpdatedAt: nowIso(),
    tick: 0,
    toasts: [],
    demoOpen: false,
    viewNonce: 0,
  };
}

type Actions = { [K in keyof AppState as AppState[K] extends (...args: never[]) => unknown ? K : never]: AppState[K] };

// ------------------------------------------------------------------ store

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState(),

  select: (ref) => set({ selected: ref }),

  focusOn: (ref) =>
    set((s) => ({
      selected: ref,
      focus: { ref, nonce: ++nonce },
      layers: { ...s.layers, [layerFor(ref, s)]: true },
    })),

  fitTo: (points) => set({ fit: points.length ? { points, nonce: ++nonce } : null }),

  toggleLayer: (key) =>
    set((s) => {
      const layers = { ...s.layers, [key]: !s.layers[key] };
      const selected = s.selected && !layers[layerFor(s.selected, s)] ? null : s.selected;
      return { layers, selected };
    }),

  applyQuickFilter: (f) =>
    set((s) => {
      if (activeQuickFilter(s.layers) === f) return { layers: { ...DEFAULT_LAYERS } };
      const keys = FILTER_LAYERS[f];
      const layers = Object.fromEntries(LAYER_KEYS.map((k) => [k, keys.includes(k)])) as Record<LayerKey, boolean>;
      const selected = s.selected && !layers[layerFor(s.selected, s)] ? null : s.selected;
      return { layers, selected };
    }),

  showLayers: (keys) =>
    set({
      layers: Object.fromEntries(LAYER_KEYS.map((k) => [k, keys.includes(k)])) as Record<LayerKey, boolean>,
      selected: null,
    }),

  planJourney: (journeyId) => set({ journeyId, chosenRouteId: null, selected: null }),
  setMode: (mode) => set({ mode, chosenRouteId: null }),
  chooseRoute: (routeId) => set({ chosenRouteId: routeId }),

  startNavigation: () => {
    const s = get();
    const journey = journeyById(s.journeyId);
    if (!journey) return false;
    const choice = routeChoice(journey, s.mode, s.segments, s.transport);
    const chosen = choice.all.find((e) => e.route.id === s.chosenRouteId && !e.compromised);
    const pick = chosen ?? choice.recommended;
    if (!pick) return false;
    set({ nav: navFromRoute(journey.id, pick.route, pick.eta), selected: null });
    return true;
  },

  tickNavigation: (dtMs) =>
    set((s) => {
      const { nav } = s;
      if (nav.status !== 'active' || nav.paused || nav.reroute) return {};
      const travelled = Math.min(nav.total, nav.travelled + dtMs * nav.realSpeed);
      return { nav: { ...nav, travelled, status: travelled >= nav.total ? 'arrived' : 'active' } };
    }),

  setNavPaused: (paused) => set((s) => ({ nav: { ...s.nav, paused } })),

  acceptReroute: () => {
    const s = get();
    const prompt = s.nav.reroute;
    const target = journeyById(s.nav.journeyId)?.routes.find((r) => r.id === prompt?.toRouteId);
    if (!prompt || !target) return set({ nav: { ...s.nav, reroute: null } });
    const nav = rerouteNav(s.nav, target, evaluateRoute(target, s.segments, s.transport).eta);
    set({ nav });
    get().pushToast({
      tone: 'success',
      title: `Rerouted around ${prompt.streetName}`,
      body: `New arrival in ${Math.max(1, Math.round(remainingMinutes(nav)))} min.`,
    });
  },

  dismissReroute: () => {
    const s = get();
    const street = s.nav.reroute?.streetName;
    set({ nav: { ...s.nav, reroute: null } });
    if (street) get().pushToast({ tone: 'warning', title: `Your route still crosses ${street}`, body: 'Do not enter floodwater. You can end navigation at any time.' });
  },

  endNavigation: () => set({ nav: IDLE_NAV }),

  submitReport: (input) => {
    const id = `rep-${Date.now()}`;
    const report: ResidentReport = {
      id, ...input, status: 'pending', createdAt: nowIso(), reporterName: get().profile.name,
    };
    set((s) => ({ reports: [report, ...s.reports], layers: { ...s.layers, reports: true } }));
    const t = window.setTimeout(() => {
      timers.delete(t);
      get().verifyReport(id);
    }, VERIFY_DELAY_MS);
    timers.add(t);
    return id;
  },

  verifyReport: (id) => {
    const s = get();
    const report = s.reports.find((r) => r.id === id);
    if (!report || report.status === 'verified') return;
    const mine = report.reporterName === s.profile.name;
    const seg = s.segments.find((g) => g.id === report.segmentId);
    const escalate = seg && severityRank[report.severity] > severityRank[seg.severity];
    set({
      reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'verified' } : r)),
      profile: mine ? { ...s.profile, points: s.profile.points + 10 } : s.profile,
      segments: escalate
        ? s.segments.map((g) => g.id === seg.id
          ? { ...g, severity: report.severity, source: 'resident', confirmed: true, updatedAt: nowIso(),
              note: report.severity === 'flooded' ? 'Confirmed by resident reports. Do not enter floodwater.' : 'Partial flooding confirmed by residents. Take care.' }
          : g)
        : s.segments,
      flash: escalate ? { segmentId: seg.id, nonce: ++nonce } : s.flash,
    });
    const nav = escalate ? reroutePromptFor(get()) : null;
    if (nav) set({ nav });
    if (mine) {
      get().pushToast({
        tone: 'success',
        title: 'Report verified. +10 points',
        body: `Your report on ${report.streetName} is now live for 200+ people nearby.`,
        action: { label: 'View on map', to: '/', focus: { kind: 'report', id } },
      });
    }
  },

  markAlertRead: (id) => set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) })),
  markAllAlertsRead: () => set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),

  pushToast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: ++toastId }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  triggerFlooding: (segmentId) => {
    const s = get();
    const seg = s.segments.find((g) => g.id === segmentId);
    if (!seg) return;
    const onRoute = affectsUserRoute(s, segmentId);
    const alert: AppAlert = {
      id: `al-${Date.now()}`,
      type: onRoute ? 'route_disrupted' : 'council',
      severity: 'flooded',
      read: false,
      createdAt: nowIso(),
      title: `New flooding on ${seg.streetName}`,
      body: onRoute
        ? `${seg.streetName} is now impassable and is on your route. FloodPath has found a way around it.`
        : `${seg.streetName} is now impassable. City of Melbourne has closed it until the water drops.`,
      target: { kind: 'segment', id: seg.id },
      journeyId: onRoute ? (s.nav.journeyId ?? s.profile.savedRoutes[0]) : undefined,
    };
    set({
      segments: s.segments.map((g) => g.id === segmentId
        ? { ...g, severity: 'flooded', confirmed: true, updatedAt: nowIso(), note: 'New flooding detected. The street is closed. Do not enter floodwater.' }
        : g),
      alerts: [alert, ...s.alerts],
      flash: { segmentId, nonce: ++nonce },
      layers: { ...s.layers, floodZones: true },
      lastUpdatedAt: nowIso(),
    });
    const nav = reroutePromptFor(get());
    if (nav) set({ nav });
    else get().pushToast({ tone: 'danger', title: alert.title, body: 'Tap to see it on the map.', action: { label: 'View on map', to: '/', focus: alert.target } });
  },

  triggerSensorAlert: (sensorId) => {
    const s = get();
    const sensor = s.sensors.find((x) => x.id === sensorId);
    if (!sensor) return;
    const level = sensor.thresholdCm + 12;
    const seg = s.segments.find((g) => g.id === sensor.segmentId);
    const street = seg?.streetName ?? sensor.label;
    const t = nowIso();
    const alerts: AppAlert[] = [
      {
        id: `al-${Date.now()}-res`, type: 'sensor', severity: 'flooded', read: false, createdAt: t,
        title: `Rising water on ${street}`,
        body: `Water is above the safe level for walking and driving. Avoid ${street} until it drops.`,
        target: seg ? { kind: 'segment', id: seg.id } : { kind: 'sensor', id: sensor.id },
      },
      {
        id: `al-${Date.now()}-council`, type: 'council', severity: 'caution', read: false, createdAt: t,
        title: 'Sensor alert sent to City of Melbourne',
        body: `${sensor.label} reads ${level} cm, over its ${sensor.thresholdCm} cm threshold. A crew has been dispatched.`,
        target: { kind: 'sensor', id: sensor.id },
      },
    ];
    set({
      sensors: s.sensors.map((x) => (x.id === sensorId ? { ...x, waterLevelCm: level, status: 'triggered', updatedAt: t } : x)),
      segments: seg
        ? s.segments.map((g) => g.id === seg.id
          ? { ...g, severity: 'flooded', source: 'sensor', confirmed: true, updatedAt: t, note: `${sensor.label} is over its threshold. The street is closed.` }
          : g)
        : s.segments,
      alerts: [...alerts, ...s.alerts],
      flash: seg ? { segmentId: seg.id, nonce: ++nonce } : s.flash,
      layers: { ...s.layers, sensors: true, floodZones: true },
      lastUpdatedAt: t,
    });
    const nav = reroutePromptFor(get());
    if (nav) set({ nav });
    get().pushToast({ tone: 'danger', title: alerts[0].title, body: `Sensor reads ${level} cm. Council has been alerted.`, action: { label: 'View on map', to: '/', focus: { kind: 'sensor', id: sensor.id } } });
  },

  clearAllFlooding: () => {
    const t = nowIso();
    set((s) => ({
      segments: s.segments.map((g) => ({ ...g, severity: 'clear', confirmed: true, updatedAt: t, note: 'Reopened. No visible flooding. Watch for debris.' })),
      reports: [],
      sensors: s.sensors.map((x) => ({ ...x, status: 'normal', waterLevelCm: Math.round(x.thresholdCm * 0.4), updatedAt: t })),
      transport: s.transport.map((x) => ({ ...x, active: false })),
      alerts: [{
        id: `al-${Date.now()}`, type: 'council', severity: 'clear', read: false, createdAt: t,
        title: 'Flooding has cleared',
        body: 'Roads, paths and trams have reopened across Southbank. Take care around debris.',
      }, ...s.alerts],
      selected: null,
      nav: { ...s.nav, reroute: null },
      lastUpdatedAt: t,
    }));
    get().pushToast({ tone: 'success', title: 'All flooding cleared', body: 'Every street and tram line is open again.' });
  },

  resetDemo: () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    set({ ...initialState(), viewNonce: get().viewNonce + 1 });
  },

  setAutoUpdates: (on) => set({ autoUpdates: on }),

  simulateTick: () =>
    set((s) => {
      if (!s.autoUpdates) return {};
      const tick = s.tick + 1;
      const t = nowIso();
      const nudges = [1, -1, 2, -1, 1, -2];
      const sensors = s.sensors.map((x, i) => {
        let level = x.waterLevelCm + nudges[(tick + i) % nudges.length];
        level = x.status === 'normal' ? Math.min(level, x.thresholdCm - 2) : Math.max(level, x.thresholdCm + 2);
        return { ...x, waterLevelCm: Math.max(0, level), updatedAt: t };
      });
      const touched = tick % s.segments.length;
      return {
        tick,
        sensors,
        segments: s.segments.map((g, i) => (i === touched ? { ...g, updatedAt: t } : g)),
        // a second resident confirms the seeded pending report after a minute
        reports: tick === 2 ? s.reports.map((r) => (r.id === 'rep-4' ? { ...r, status: 'verified' } : r)) : s.reports,
        lastUpdatedAt: t,
      };
    }),

  setDemoOpen: (open) => set({ demoOpen: open }),
}));

export const unreadCount = (alerts: AppAlert[]) => alerts.filter((a) => !a.read).length;

/** The saved route's original path, evaluated for the home-screen banner. */
export function savedRouteIssue(s: Pick<AppState, 'profile' | 'segments' | 'transport'>) {
  for (const jid of s.profile.savedRoutes) {
    const journey = journeyById(jid);
    const original = journey?.routes.find((r) => r.mode === 'walk' && r.label === 'Original');
    if (!journey || !original) continue;
    const ev = evaluateRoute(original, s.segments, s.transport);
    if (ev.compromised && ev.blocking[0]) return { journey, segment: ev.blocking[0] };
  }
  return null;
}
