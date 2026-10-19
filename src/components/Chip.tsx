import type { ReactNode } from 'react';

interface Props {
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Figma's filter chip: light-blue pill, navy when selected. */
export function Chip({ selected, onClick, icon, children, className = '' }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition duration-150 active:scale-[0.97] ${
        selected ? 'bg-ink text-white shadow-[0_2px_8px_rgb(24_59_86/0.25)]' : 'bg-tint text-ink hover:bg-tint-strong'
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
