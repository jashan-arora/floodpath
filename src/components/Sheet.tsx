import { forwardRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  label?: string;
}

/** Bottom sheet over the map. Sizes to its content and rises in when it mounts. */
export const Sheet = forwardRef<HTMLDivElement, Props>(function Sheet({ children, className = '', label }, ref) {
  return (
    <section
      ref={ref}
      aria-label={label}
      className={`pointer-events-auto relative animate-rise rounded-t-sheet bg-white px-4 pt-2.5 pb-4 shadow-sheet ${className}`}
    >
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
      {children}
    </section>
  );
});
