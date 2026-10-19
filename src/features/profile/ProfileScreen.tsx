import { Briefcase, ChevronRight, House, Route, Trophy } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Badge, SeverityBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Toggle } from '../../components/Toggle';
import { journeyById } from '../../data/journeys';
import { timeAgo } from '../../lib/format';
import { evaluateRoute } from '../../store/selectors';
import { useNow } from '../../store/simulation';
import { Page } from '../../components/Panel';
import { useAppStore } from '../../store/useAppStore';
import { REPORT_KIND } from '../map/FeatureCard';

const LEVEL_STEP = 50;
const LEVELS = ['Neighbour', 'Street watcher', 'Community reporter', 'Flood watcher', 'Local guardian', 'Southbank champion'];

function Row({ icon, title, detail, right, onClick }: { icon: ReactNode; title: string; detail: string; right?: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-page">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-ink">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{title}</span>
          <span className="block truncate text-[13px] text-muted">{detail}</span>
        </span>
        {right}
        <ChevronRight size={16} className="shrink-0 text-subtle" aria-hidden />
      </button>
    </li>
  );
}

/** Profile and rewards indicator (CLAUDE.md 3.4: points total). */
export function ProfileScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const reports = useAppStore((s) => s.reports);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const autoUpdates = useAppStore((s) => s.autoUpdates);
  const setAutoUpdates = useAppStore((s) => s.setAutoUpdates);
  const planJourney = useAppStore((s) => s.planJourney);
  const setMode = useAppStore((s) => s.setMode);
  const focusOn = useAppStore((s) => s.focusOn);
  const now = useNow();

  const mine = reports.filter((r) => r.reporterName === profile.name);
  const level = Math.min(LEVELS.length - 1, Math.floor(profile.points / LEVEL_STEP));
  const into = profile.points % LEVEL_STEP;
  const saved = useMemo(
    () => profile.savedRoutes.map((id) => {
      const j = journeyById(id);
      const original = j?.routes.find((r) => r.mode === 'walk' && r.label === 'Original');
      return j && original ? { journey: j, ev: evaluateRoute(original, segments, transport) } : null;
    }).filter((x) => !!x),
    [profile.savedRoutes, segments, transport],
  );
  const plan = (id: string) => {
    planJourney(id);
    setMode('walk');
    navigate(`/route/${id}`);
  };
  const initials = profile.name.split(' ').map((p) => p[0]).join('');

  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white via-page to-sky pb-6">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-white">{initials}</span>
        <div>
          <h1 className="text-[24px] leading-tight font-bold">{profile.name}</h1>
          <p className="text-[14px] text-muted">Southbank resident</p>
        </div>
      </header>

      <section aria-label="Rewards" className="mx-4 rounded-card bg-ink p-4 text-white shadow-float">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/12 text-[#ffd57a]"><Trophy size={22} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[30px] leading-none font-semibold tabular-nums">{profile.points}<span className="ml-1 font-sans text-[14px] font-medium text-white/70">points</span></p>
            <p className="mt-1 text-[13px] text-white/75">{LEVELS[level]}</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={LEVEL_STEP} aria-valuenow={into} aria-label="Progress to next level">
          <div className="h-full rounded-full bg-[#8cc8f5] transition-[width] duration-700" style={{ width: `${(into / LEVEL_STEP) * 100}%` }} />
        </div>
        <p className="mt-2 text-[12.5px] text-white/75">
          {LEVEL_STEP - into} points to {LEVELS[Math.min(LEVELS.length - 1, level + 1)]}. Each verified report earns 10.
        </p>
      </section>

      <h2 className="px-5 pt-6 pb-2 font-sans text-[13px] font-semibold text-muted">Your reports</h2>
      {mine.length === 0 ? (
        <div className="mx-4 flex items-center justify-between gap-3 rounded-card bg-white p-4 shadow-card">
          <p className="text-[14px] text-muted">You haven’t reported anything yet.</p>
          <Button size="sm" onClick={() => navigate('/report')}>Report flooding</Button>
        </div>
      ) : (
        <ul className="mx-4 divide-y divide-line overflow-hidden rounded-card bg-white shadow-card">
          {mine.map((r) => (
            <Row
              key={r.id}
              icon={<Route size={17} />}
              title={`${REPORT_KIND[r.kind]} on ${r.streetName}`}
              detail={timeAgo(r.createdAt, now)}
              right={<StatusBadge verified={r.status === 'verified'} pendingLabel="Checking" />}
              onClick={() => { focusOn({ kind: 'report', id: r.id }); navigate('/'); }}
            />
          ))}
        </ul>
      )}

      <h2 className="px-5 pt-6 pb-2 font-sans text-[13px] font-semibold text-muted">Saved places and routes</h2>
      <ul className="mx-4 divide-y divide-line overflow-hidden rounded-card bg-white shadow-card">
        <Row icon={<House size={17} />} title="Home" detail={profile.homeAddress} onClick={() => navigate('/')} />
        <Row icon={<Briefcase size={17} />} title="Work" detail={profile.workAddress} onClick={() => plan(profile.savedRoutes[0] ?? 'j-fss')} />
        {saved.map(({ journey, ev }) => (
          <Row
            key={journey.id}
            icon={<Route size={17} />}
            title="Home to work"
            detail={ev.compromised ? `Usual route blocked at ${ev.blocking[0]?.streetName ?? 'a flooded street'}` : 'Usual route is clear'}
            right={ev.compromised ? <SeverityBadge severity="flooded" label="Disrupted" /> : <Badge tone="clear">Clear</Badge>}
            onClick={() => plan(journey.id)}
          />
        ))}
      </ul>

      <h2 className="px-5 pt-6 pb-2 font-sans text-[13px] font-semibold text-muted">Preferences</h2>
      <div className="mx-4 flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Live updates</p>
          <p className="text-[13px] text-muted">Refresh sensor readings and reports every 30 seconds.</p>
        </div>
        <Toggle checked={autoUpdates} onChange={setAutoUpdates} label="Live updates" />
      </div>

    </div>
    </Page>
  );
}
