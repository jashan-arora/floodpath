import { ArrowUp, CornerUpLeft, CornerUpRight, Flag, TramFront, Undo2 } from 'lucide-react';
import type { NavState } from '../../store/navigation';
import { formatDistance } from '../../lib/format';

export function maneuverIcon(instruction: string) {
  if (/u-turn/i.test(instruction)) return Undo2;
  if (/arrive/i.test(instruction)) return Flag;
  if (/board|get off/i.test(instruction)) return TramFront;
  if (/left/i.test(instruction)) return CornerUpLeft;
  if (/right/i.test(instruction)) return CornerUpRight;
  return ArrowUp;
}

/** Step-by-step instruction banner (CLAUDE.md 3.2). */
export function InstructionBanner({ nav }: { nav: NavState }) {
  const nextIdx = nav.steps.findIndex((s) => s.d > nav.travelled + 3);
  const next = nav.steps[nextIdx];
  const current = [...nav.steps].reverse().find((s) => s.d <= nav.travelled + 3);
  const then = nextIdx >= 0 ? nav.steps[nextIdx + 1] : undefined;
  if (!next) return null;
  const Icon = maneuverIcon(next.instruction);

  return (
    <div className="overflow-hidden rounded-[18px] bg-ink text-white shadow-float">
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/12">
          <Icon size={28} strokeWidth={2.4} aria-hidden />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="font-display text-[26px] leading-none font-semibold tabular-nums">{formatDistance(next.d - nav.travelled)}</p>
          <p className="mt-1 text-[16px] leading-snug font-medium">{next.instruction}</p>
        </div>
      </div>
      {(then || current) && (
        <p className="border-t border-white/10 bg-ink-deep/40 px-4 py-2 text-[13px] text-white/75">
          {then ? `Then ${then.instruction.charAt(0).toLowerCase()}${then.instruction.slice(1)}` : current?.instruction}
        </p>
      )}
    </div>
  );
}
