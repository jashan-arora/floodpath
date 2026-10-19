import { ArrowLeft, Briefcase, Hospital, MapPin, Search, ShoppingBasket, TrainFront, X } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '../../components/EmptyState';
import { IconButton } from '../../components/IconButton';
import { Page } from '../../components/Panel';
import { JOURNEYS } from '../../data/journeys';
import { CURRENT_LOCATION } from '../../data/places';
import type { Journey } from '../../data/types';
import { formatDistance } from '../../lib/format';
import { distance } from '../../store/geo';
import { routeChoice } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

const PLACE_ICON: Record<string, typeof MapPin> = { 'j-fss': TrainFront, 'j-qvm': ShoppingBasket, 'j-rmh': Hospital };

function matches(j: Journey, q: string) {
  const s = q.trim().toLowerCase();
  return j.destination.toLowerCase().includes(s) || j.keywords.some((k) => k.includes(s) || s.includes(k));
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.trim().toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  const n = query.trim().length;
  return <>{text.slice(0, i)}<mark className="bg-transparent font-bold text-ink">{text.slice(i, i + n)}</mark>{text.slice(i + n)}</>;
}

/** Destination search with autocomplete from the mock place list (CLAUDE.md 3.2). */
export function SearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const planJourney = useAppStore((s) => s.planJourney);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  const workId = useAppStore((s) => s.profile.savedRoutes[0]);
  const results = useMemo(() => (query.trim() ? JOURNEYS.filter((j) => matches(j, query)) : JOURNEYS), [query]);

  const pick = (j: Journey) => {
    planJourney(j.id);
    navigate(`/route/${j.id}`);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results[0]) pick(results[0]);
    if (e.key === 'Escape') navigate(-1);
  };
  const work = JOURNEYS.find((j) => j.id === workId);

  return (
    <Page>
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center gap-1.5 border-b border-line px-2 py-3">
        <IconButton label="Back" tone="plain" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </IconButton>
        <label className="flex h-12 flex-1 items-center gap-2 rounded-control bg-field px-3 ring-1 ring-accent/20 focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} className="text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Where to?"
            aria-label="Search for a destination"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-subtle"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="rounded-full p-1 text-muted hover:bg-tint">
              <X size={16} />
            </button>
          )}
        </label>
      </div>

      <p className="flex items-center gap-2 px-5 py-3 text-[13px] text-muted">
        <span aria-hidden className="size-2.5 rounded-full bg-accent ring-4 ring-accent/20" />
        From your location, {CURRENT_LOCATION.label}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {!query && work && (
          <>
            <h2 className="px-5 pt-1 pb-1 font-sans text-[13px] font-semibold text-muted">Saved</h2>
            <button type="button" onClick={() => pick(work)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-page">
              <span className="flex size-10 items-center justify-center rounded-full bg-ink text-white"><Briefcase size={18} /></span>
              <span>
                <span className="block text-[15px] font-semibold">Work</span>
                <span className="block text-[13px] text-muted">{work.destination}</span>
              </span>
            </button>
          </>
        )}
        <h2 className="px-5 pt-3 pb-1 font-sans text-[13px] font-semibold text-muted">{query ? 'Places' : 'Suggested'}</h2>
        {results.length === 0 ? (
          <EmptyState
            icon={<MapPin size={24} />}
            title={`No places match “${query.trim()}”`}
            body="Try Flinders St Station, Queen Victoria Market or Royal Melbourne Hospital."
          />
        ) : (
          <ul>
            {results.map((j) => {
              const Icon = PLACE_ICON[j.id] ?? MapPin;
              const walk = routeChoice(j, 'walk', segments, transport);
              const flooded = walk.original?.compromised;
              return (
                <li key={j.id}>
                  <button type="button" onClick={() => pick(j)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-page active:bg-tint">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-ink"><Icon size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink-soft"><Highlight text={j.destination} query={query} /></span>
                      <span className="block text-[13px] text-muted">
                        {j.area}, {formatDistance(distance(CURRENT_LOCATION.position, j.location))} away
                      </span>
                    </span>
                    {flooded && <span className="shrink-0 rounded-full bg-caution-tint px-2 py-0.5 text-[11px] font-semibold text-caution-ink">Flooding on usual route</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
    </Page>
  );
}
