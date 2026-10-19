import { CircleCheck, Info, OctagonX, ShieldCheck, TramFront, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../../components/Badge';
import { formatKm, plural } from '../../lib/format';
import type { RouteEvaluation } from '../../store/selectors';

function Reason({ icon, tone, children }: { icon: ReactNode; tone: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <span className={`mt-px shrink-0 ${tone}`}>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

const list = (names: string[]) => names.join(', ').replace(/, ([^,]*)$/, ' and $1');

interface Props {
  evaluation: RouteEvaluation;
  recommended: boolean;
  selected: boolean;
  onSelect: () => void;
}

/** Route card (CLAUDE.md 3.2): ETA, distance and what the route avoids or runs into. */
export function RouteCard({ evaluation: e, recommended, selected, onSelect }: Props) {
  const { route } = e;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-card border-2 p-3 text-left transition duration-150 active:scale-[0.99] ${
        selected ? (e.compromised ? 'border-flooded/60 bg-flooded-tint/40' : 'border-accent bg-tint/50') : 'border-line bg-white hover:border-tint-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-semibold">{route.label} route</span>
            {recommended && <Badge tone="clear" icon={<ShieldCheck size={13} strokeWidth={2.4} aria-hidden />}>Recommended</Badge>}
            {e.compromised && <Badge tone="flooded" icon={<OctagonX size={13} strokeWidth={2.4} aria-hidden />}>Blocked</Badge>}
          </div>
          <ul className="mt-1.5 space-y-1 text-[13px] leading-snug text-ink-soft">
            {e.blocking.map((s) => (
              <Reason key={s.id} icon={<OctagonX size={14} />} tone="text-flooded">Flooded at {s.streetName}</Reason>
            ))}
            {e.disruptions.map((t) => (
              <Reason key={t.id} icon={<TramFront size={14} />} tone="text-transit">{t.route} {t.status === 'suspended' ? 'suspended' : 'disrupted'}</Reason>
            ))}
            {!e.compromised && e.avoided.length > 0 && (
              <Reason icon={<ShieldCheck size={14} />} tone="text-safe">
                Avoids {plural(e.avoided.length, 'flooded street')}: {list(e.avoided.map((s) => s.streetName))}
              </Reason>
            )}
            {e.cautions.map((s) => (
              <Reason key={s.id} icon={<TriangleAlert size={14} />} tone="text-caution">Caution on {s.streetName}, allow extra time</Reason>
            ))}
            {!e.compromised && e.avoided.length === 0 && e.cautions.length === 0 && (
              <Reason icon={<CircleCheck size={14} />} tone="text-clear">No flooding reported on this route</Reason>
            )}
          </ul>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[24px] leading-none font-semibold tabular-nums">
            {e.eta}
            <span className="ml-0.5 font-sans text-[13px] font-medium text-muted">min</span>
          </p>
          <p className="mt-1 text-[13px] text-muted tabular-nums">{formatKm(route.distanceKm)}</p>
        </div>
      </div>
      {route.note && !e.compromised && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-[10px] bg-page px-2.5 py-2 text-[12.5px] leading-snug text-ink-soft">
          <Info size={14} className="mt-px shrink-0 text-accent" aria-hidden />
          {route.note}
        </p>
      )}
    </button>
  );
}
