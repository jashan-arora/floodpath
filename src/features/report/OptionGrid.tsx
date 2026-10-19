import type { LucideIcon } from 'lucide-react';

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  Icon: LucideIcon;
  /** colour for the icon and selected outline */
  color?: string;
}

/** Figma's option tiles ("What is happening?", "Is access affected?") as a single-choice group. */
export function OptionGrid<T extends string>({ label, options, value, onChange }: {
  label: string; options: Option<T>[]; value: T | null; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={active ? { borderColor: o.color ?? 'var(--color-accent)' } : undefined}
            className={`flex min-h-[52px] items-center gap-2.5 rounded-control border-2 px-3 py-2 text-left transition duration-150 active:scale-[0.98] ${
              active ? 'bg-white shadow-card' : 'border-transparent bg-field hover:bg-tint'
            }`}
          >
            <o.Icon size={20} strokeWidth={2.2} style={{ color: o.color ?? 'var(--color-ink-soft)' }} className="shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[14px] leading-tight font-semibold">{o.label}</span>
              {o.hint && <span className="block text-[12px] leading-tight text-muted">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
