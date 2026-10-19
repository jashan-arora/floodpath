import { CircleCheck, Info, OctagonX, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'danger' | 'warning' | 'info' | 'success';

const STYLES: Record<Tone, { box: string; icon: string; Icon: typeof Info }> = {
  danger: { box: 'bg-flooded-tint border-flooded/25', icon: 'bg-flooded text-white', Icon: OctagonX },
  warning: { box: 'bg-caution-tint border-caution/30', icon: 'bg-caution text-white', Icon: TriangleAlert },
  info: { box: 'bg-tint border-accent/20', icon: 'bg-accent text-white', Icon: Info },
  success: { box: 'bg-safe-tint border-safe/20', icon: 'bg-safe text-white', Icon: CircleCheck },
};

interface Props {
  tone: Tone;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AlertBanner({ tone, title, body, action, className = '' }: Props) {
  const { box, icon, Icon } = STYLES[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-center gap-3 rounded-card border p-3 ${box} ${className}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${icon}`}>
        <Icon size={18} strokeWidth={2.4} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-ink">{title}</p>
        {body && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{body}</p>}
      </div>
      {action}
    </div>
  );
}
