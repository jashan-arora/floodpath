import { Briefcase, ChevronRight, Gauge, House, OctagonX, Search, TramFront, TriangleAlert } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AlertBanner } from '../../components/AlertBanner';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { CURRENT_LOCATION } from '../../data/places';
import type { FeatureRef } from '../../data/types';
import { formatDistance, timeAgo } from '../../lib/format';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { distance } from '../../store/geo';
import { useNow } from '../../store/simulation';
import { savedRouteIssue, useAppStore } from '../../store/useAppStore';
import { FeatureCard } from './FeatureCard';
import { FilterChips } from './FilterChips';
import { LayerPanel } from './LayerPanel';
import { Legend } from './Legend';
import { FloodedCount, LiveStatus, LocateButton, SensorShortcut, TopBar } from './MapControls';
import { useInset } from './mapUi';

function Shortcut({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control border border-line bg-white px-3 py-2.5 text-left transition hover:border-tint-strong hover:bg-page active:scale-[0.98]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-ink">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight font-semibold">{title}</span>
        <span className="block truncate text-[12px] text-muted">{detail}</span>
      </span>
    </button>
  );
}

/** "Where to?" plus the saved-route alert banner (CLAUDE.md 3.1). */
function WhereTo() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const pois = useAppStore((s) => s.pois);
  const planJourney = useAppStore((s) => s.planJourney);
  const focusOn = useAppStore((s) => s.focusOn);
  const issue = useMemo(() => savedRouteIssue({ profile, segments, transport }), [profile, segments, transport]);
  const shelter = useMemo(
    () => pois.filter((p) => p.type === 'shelter').sort((a, b) => distance(CURRENT_LOCATION.position, a.location) - distance(CURRENT_LOCATION.position, b.location))[0],
    [pois],
  );
  const plan = (id: string) => {
    planJourney(id);
    navigate(`/route/${id}`);
  };

  return (
    <div className="space-y-3">
      {issue && (
        <AlertBanner
          tone="danger"
          title={`${issue.segment.streetName} closed`}
          body={`Flooding is blocking your usual route to ${issue.journey.destination}.`}
          action={<Button size="sm" onClick={() => plan(issue.journey.id)}>Reroute</Button>}
        />
      )}
      <button
        type="button"
        onClick={() => navigate('/search')}
        className="flex h-[52px] w-full items-center gap-3 rounded-control bg-field px-4 text-left text-[16px] text-muted ring-1 ring-accent/20 transition hover:bg-tint"
      >
        <Search size={20} className="text-ink" aria-hidden />
        Where to?
      </button>
      <div className="flex gap-2">
        <Shortcut icon={<Briefcase size={16} />} title="Work" detail={profile.workAddress} onClick={() => plan(profile.savedRoutes[0] ?? 'j-fss')} />
        {shelter && (
          <Shortcut
            icon={<House size={16} />}
            title="Nearest shelter"
            detail={`${formatDistance(distance(CURRENT_LOCATION.position, shelter.location))} away`}
            onClick={() => focusOn({ kind: 'poi', id: shelter.id })}
          />
        )}
      </div>
    </div>
  );
}

function StatusRow({ icon, tone, title, detail, onClick }: { icon: ReactNode; tone: string; title: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-page">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{title}</span>
          <span className="block truncate text-[12.5px] text-muted">{detail}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-subtle" aria-hidden />
      </button>
    </li>
  );
}

/** Laptop home panel: trip planning plus a live summary of what is affected right now. */
function Overview() {
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const sensors = useAppStore((s) => s.sensors);
  const focusOn = useAppStore((s) => s.focusOn);
  const now = useNow();
  const affected = segments
    .filter((g) => g.severity !== 'clear')
    .sort((a, b) => Number(b.severity === 'flooded') - Number(a.severity === 'flooded') || b.updatedAt.localeCompare(a.updatedAt));
  const disruptions = transport.filter((t) => t.active);
  const high = sensors.filter((x) => x.status === 'triggered');
  const go = (ref: FeatureRef) => focusOn(ref);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[30px] leading-tight font-bold tracking-[-0.01em]">Live map</h1>
          <FloodedCount />
        </div>
        <p className="mt-1 text-[14px] text-muted"><LiveStatus /></p>
      </header>
      <WhereTo />

      <section>
        <h2 className="mb-2 font-sans text-[13px] font-semibold text-muted">Streets affected now</h2>
        {affected.length === 0 ? (
          <p className="rounded-card bg-white p-4 text-[14px] text-muted shadow-card">No flooding reported in Southbank right now.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-white shadow-card">
            {affected.map((g) => (
              <StatusRow
                key={g.id}
                onClick={() => go({ kind: 'segment', id: g.id })}
                tone={g.severity === 'flooded' ? 'bg-flooded-tint text-flooded' : 'bg-caution-tint text-caution-ink'}
                icon={g.severity === 'flooded' ? <OctagonX size={16} aria-hidden /> : <TriangleAlert size={16} aria-hidden />}
                title={`${g.streetName}${g.severity === 'flooded' ? ' closed' : ', take care'}`}
                detail={`Updated ${timeAgo(g.updatedAt, now)}`}
              />
            ))}
          </ul>
        )}
      </section>

      {(disruptions.length > 0 || high.length > 0) && (
        <section>
          <h2 className="mb-2 font-sans text-[13px] font-semibold text-muted">Trams, buses and sensors</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-white shadow-card">
            {disruptions.map((t) => (
              <StatusRow key={t.id} onClick={() => go({ kind: 'transport', id: t.id })} tone="bg-[#fdf0e1] text-transit" icon={<TramFront size={16} aria-hidden />} title={t.route} detail={t.message} />
            ))}
            {high.map((x) => (
              <StatusRow key={x.id} onClick={() => go({ kind: 'sensor', id: x.id })} tone="bg-flooded-tint text-flooded" icon={<Gauge size={16} aria-hidden />} title={x.label} detail={`${x.waterLevelCm} cm, above its ${x.thresholdCm} cm threshold`} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function MapHome() {
  const desktop = useIsDesktop();
  const [layersOpen, setLayersOpen] = useState(false);
  const selected = useAppStore((s) => s.selected);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useInset(top, 'top');
  useInset(bottom, 'bottom');

  const detail = selected ? <FeatureCard key={`${selected.kind}-${selected.id}`} feature={selected} /> : null;

  // Laptop: the map controls live in the shell; this screen only fills the side panel.
  if (desktop) return <Panel label={selected ? 'Details' : 'Overview'}>{detail ?? <Overview />}</Panel>;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div ref={top} className="pointer-events-auto space-y-2 px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <TopBar onLayers={() => setLayersOpen(true)} />
        <FilterChips />
      </div>
      <div className="flex-1" />
      <div ref={bottom}>
        <div className="flex items-end justify-between gap-2 px-3 pb-2">
          <Legend />
          <div className="relative">
            <div className="absolute right-0 bottom-full mb-2">
              <SensorShortcut />
            </div>
            <LocateButton />
          </div>
        </div>
        <div className="pointer-events-auto max-h-[min(440px,58vh)] overflow-y-auto rounded-t-sheet">
          <Panel label={selected ? 'Details' : 'Plan a trip'}>{detail ?? <WhereTo />}</Panel>
        </div>
      </div>
      {layersOpen && <LayerPanel onClose={() => setLayersOpen(false)} />}
    </div>
  );
}
