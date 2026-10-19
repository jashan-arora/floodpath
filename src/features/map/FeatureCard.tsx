import { Car, Footprints, TramFront, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Badge, SeverityBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { CURRENT_LOCATION } from '../../data/places';
import type { FeatureRef, FloodSegment, ReportKind, TramDisruption, TravelMode } from '../../data/types';
import { formatDistance, timeAgo } from '../../lib/format';
import { distance } from '../../store/geo';
import { useNow } from '../../store/simulation';
import { useAppStore } from '../../store/useAppStore';
import { POI_STYLE } from './markers';

const SOURCE: Record<FloodSegment['source'], string> = {
  sensor: 'Water level sensor',
  resident: 'Community report',
  council: 'City of Melbourne',
};

export const REPORT_KIND: Record<ReportKind, string> = {
  flooded_road: 'Flooded road',
  blocked_footpath: 'Blocked footpath',
  power_outage: 'Power outage',
  debris: 'Debris',
};

const STATUS: Record<TramDisruption['status'], string> = {
  suspended: 'Suspended',
  cancelled: 'Service cancelled',
  diverted: 'Diverted',
  not_stopping: 'Not stopping',
};

const MODE_ICON: Record<TravelMode, typeof Car> = { walk: Footprints, drive: Car, transit: TramFront };
const MODE_WORD: Record<TravelMode, string> = { walk: 'walking', drive: 'driving', transit: 'trams' };

function segmentTitle(s: FloodSegment) {
  if (s.severity === 'flooded') return `Flooding on ${s.streetName}`;
  if (s.severity === 'caution') return `Partial flooding on ${s.streetName}`;
  return `${s.streetName} is open`;
}

function Shell({ title, badges, meta, children, action, onClose }: {
  title: string; badges: ReactNode; meta: ReactNode; children?: ReactNode; action?: ReactNode; onClose: () => void;
}) {
  return (
    <article className="animate-fade">
      <div className="flex items-start justify-between gap-3">
        <h2 className="pt-1 text-[21px] font-semibold leading-tight text-ink">{title}</h2>
        <IconButton label="Close details" tone="plain" size={36} className="-mt-0.5 -mr-1.5 text-muted" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>
      <div className="mt-3 space-y-0.5 text-[14px] text-muted">{meta}</div>
      {children && <div className="mt-3 text-[15px] leading-relaxed text-ink">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}

/** The Figma detail card: title, verification badge, source, time, description, "Report an update". */
export function FeatureCard({ feature }: { feature: FeatureRef }) {
  const s = useAppStore();
  const navigate = useNavigate();
  const now = useNow();
  const close = () => s.select(null);
  const reportUpdate = (street: string) => (
    <Button block size="lg" onClick={() => navigate(`/report?street=${encodeURIComponent(street)}`)}>Report an update</Button>
  );

  if (feature.kind === 'segment') {
    const seg = s.segments.find((x) => x.id === feature.id);
    if (!seg) return null;
    return (
      <Shell
        title={segmentTitle(seg)}
        onClose={close}
        badges={<><SeverityBadge severity={seg.severity} label={seg.severity === 'clear' ? 'Open' : undefined} /><StatusBadge verified={seg.confirmed} /></>}
        meta={<><p>Source: {SOURCE[seg.source]}</p><p>Updated {timeAgo(seg.updatedAt, now)}</p></>}
        action={reportUpdate(seg.streetName)}
      >
        <p>{seg.note}</p>
        {seg.severity !== 'clear' && (
          <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
            <span className="flex gap-1 text-ink-soft">
              {seg.affectsModes.map((m) => { const I = MODE_ICON[m]; return <I key={m} size={15} aria-hidden />; })}
            </span>
            Affects {seg.affectsModes.map((m) => MODE_WORD[m]).join(', ').replace(/, ([^,]*)$/, ' and $1')}
          </p>
        )}
      </Shell>
    );
  }

  if (feature.kind === 'report') {
    const r = s.reports.find((x) => x.id === feature.id);
    if (!r) return null;
    return (
      <Shell
        title={`${REPORT_KIND[r.kind]} on ${r.streetName}`}
        onClose={close}
        badges={<><SeverityBadge severity={r.severity} label={r.severity === 'flooded' ? 'Impassable' : 'Caution'} /><StatusBadge verified={r.status === 'verified'} pendingLabel="Checking" /></>}
        meta={<><p>Reported by {r.reporterName === s.profile.name ? 'you' : r.reporterName}</p><p>{timeAgo(r.createdAt, now)}</p></>}
        action={reportUpdate(r.streetName)}
      >
        {r.photoUrl && <img src={r.photoUrl} alt={`Photo of ${r.streetName}`} className="mb-3 aspect-[21/9] w-full rounded-control object-cover" />}
        {r.note && <p>{r.note}</p>}
      </Shell>
    );
  }

  if (feature.kind === 'sensor') {
    const x = s.sensors.find((y) => y.id === feature.id);
    if (!x) return null;
    const over = x.status === 'triggered';
    const pct = Math.min(100, (x.waterLevelCm / (x.thresholdCm * 1.5)) * 100);
    const mark = (x.thresholdCm / (x.thresholdCm * 1.5)) * 100;
    return (
      <Shell
        title={x.label}
        onClose={close}
        badges={over ? <SeverityBadge severity="flooded" label="Above threshold" /> : <SeverityBadge severity="clear" label="Normal" />}
        meta={<p>Updated {timeAgo(x.updatedAt, now)}</p>}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[34px] font-semibold leading-none tabular-nums">{x.waterLevelCm}</span>
          <span className="text-muted">cm of water</span>
        </div>
        <div className="relative mt-3 h-2.5 rounded-full bg-field" role="img" aria-label={`${x.waterLevelCm} of ${x.thresholdCm} centimetre threshold`}>
          <div className={`h-full rounded-full transition-[width] duration-700 ${over ? 'bg-flooded' : 'bg-sensor'}`} style={{ width: `${pct}%` }} />
          <div className="absolute -top-1 h-[18px] w-0.5 rounded bg-ink" style={{ left: `${mark}%` }} />
        </div>
        <p className="mt-2 text-[13px] text-muted">
          Council is alerted above {x.thresholdCm} cm. {over ? 'An alert has been sent and residents nearby have been warned.' : 'Readings are normal.'}
        </p>
      </Shell>
    );
  }

  if (feature.kind === 'poi') {
    const p = s.pois.find((x) => x.id === feature.id);
    if (!p) return null;
    const style = POI_STYLE[p.type];
    return (
      <Shell
        title={p.name}
        onClose={close}
        badges={<Badge tone="info" icon={<style.Icon size={13} strokeWidth={2.4} aria-hidden />}>{style.label}</Badge>}
        meta={<p>{formatDistance(distance(CURRENT_LOCATION.position, p.location))} from you</p>}
      >
        {p.detail && <p>{p.detail}</p>}
      </Shell>
    );
  }

  const t = s.transport.find((x) => x.id === feature.id);
  if (!t) return null;
  return (
    <Shell
      title={`${t.route}: ${STATUS[t.status].toLowerCase()}`}
      onClose={close}
      badges={<><Badge tone="caution" icon={<TramFront size={13} strokeWidth={2.4} aria-hidden />}>{STATUS[t.status]}</Badge><StatusBadge verified={t.verified} /></>}
      meta={<><p>Source: {t.operator}</p><p>Stops: {t.stopsAffected.join(', ')}</p><p>Updated {timeAgo(t.updatedAt, now)}</p></>}
    >
      <p>{t.message}</p>
    </Shell>
  );
}
