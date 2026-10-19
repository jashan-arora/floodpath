interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

/** Switch in Figma's accent blue. The visible label lives next to it; `label` names it for screen readers. */
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-[#cdd6df]'}`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-soft)] ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
