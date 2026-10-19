import { Car, Footprints, TramFront } from 'lucide-react';
import type { Journey, TravelMode } from '../../data/types';
import { modeLabel } from '../../lib/format';
import { routeChoice } from '../../store/selectors';
import { useAppStore } from '../../store/useAppStore';

const MODES: { mode: TravelMode; Icon: typeof Car }[] = [
  { mode: 'walk', Icon: Footprints },
  { mode: 'drive', Icon: Car },
  { mode: 'transit', Icon: TramFront },
];

/** Walk / Drive / Transit, each showing the time of its recommended route. */
export function ModeSelector({ journey }: { journey: Journey }) {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const segments = useAppStore((s) => s.segments);
  const transport = useAppStore((s) => s.transport);
  return (
    <div role="radiogroup" aria-label="Travel mode" className="grid grid-cols-3 gap-1 rounded-control bg-field p-1">
      {MODES.map(({ mode: m, Icon }) => {
        const rec = routeChoice(journey, m, segments, transport).recommended;
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(m)}
            className={`flex h-[52px] flex-col items-center justify-center rounded-[9px] transition ${active ? 'bg-white text-ink shadow-card' : 'text-ink-soft hover:bg-white/60'}`}
          >
            <span className="flex items-center gap-1.5 text-[14px] font-semibold">
              <Icon size={16} strokeWidth={2.3} aria-hidden />
              {modeLabel[m]}
            </span>
            <span className={`text-[12px] tabular-nums ${rec ? 'text-muted' : 'font-semibold text-flooded-ink'}`}>
              {rec ? `${rec.eta} min` : 'No clear route'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
