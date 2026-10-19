import { CircleCheck, Clock, OctagonX, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Severity } from '../data/types';
import { severityLabel } from '../lib/format';

type Tone = 'flooded' | 'caution' | 'clear' | 'neutral' | 'info';

const TONES: Record<Tone, string> = {
  flooded: 'bg-flooded-tint text-flooded-ink',
  caution: 'bg-caution-tint text-caution-ink',
  clear: 'bg-safe-tint text-safe',
  neutral: 'bg-page text-muted',
  info: 'bg-tint text-link',
};

export function Badge({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

const SEVERITY_ICON = { flooded: OctagonX, caution: TriangleAlert, clear: CircleCheck };

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <Badge tone={severity} icon={<Icon size={13} strokeWidth={2.4} aria-hidden />}>
      {label ?? severityLabel[severity]}
    </Badge>
  );
}

/** Verified (teal) or unverified/pending (amber). Figma used amber for both; teal makes them distinct. */
export function StatusBadge({ verified, pendingLabel = 'Unverified' }: { verified: boolean; pendingLabel?: string }) {
  return verified ? (
    <Badge tone="clear" icon={<ShieldCheck size={13} strokeWidth={2.4} aria-hidden />}>Verified</Badge>
  ) : (
    <Badge tone="caution" icon={<Clock size={13} strokeWidth={2.4} aria-hidden />}>{pendingLabel}</Badge>
  );
}
