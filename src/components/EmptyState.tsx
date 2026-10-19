import type { ReactNode } from 'react';

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-tint text-ink">{icon}</span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
