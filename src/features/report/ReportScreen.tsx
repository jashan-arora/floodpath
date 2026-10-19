import { Award, CircleCheck, Construction, Footprints, OctagonX, TriangleAlert, Users, Waves, Zap } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Page } from '../../components/Panel';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Toggle } from '../../components/Toggle';
import type { ReportKind, Severity } from '../../data/types';
import { VERIFY_DELAY_MS, useAppStore } from '../../store/useAppStore';
import { CURRENT_REPORT_LOCATION, LocationField, locationForStreet, type LocationValue } from './LocationField';
import { OptionGrid, type Option } from './OptionGrid';
import { PhotoPicker } from './PhotoPicker';

const KINDS: Option<ReportKind>[] = [
  { value: 'flooded_road', label: 'Flooded road', Icon: Waves },
  { value: 'blocked_footpath', label: 'Blocked footpath', Icon: Footprints },
  { value: 'power_outage', label: 'Power outage', Icon: Zap },
  { value: 'debris', label: 'Debris', Icon: Construction },
];

const SEVERITIES: Option<Exclude<Severity, 'clear'>>[] = [
  { value: 'caution', label: 'Caution', hint: 'Partly blocked, passable with care', Icon: TriangleAlert, color: '#d4860f' },
  { value: 'flooded', label: 'Impassable', hint: 'Fully blocked, do not enter', Icon: OctagonX, color: '#e24b4a' },
];

const NOTE_MAX = 280;

function Section({ title, optional, children }: { title: string; optional?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-card bg-white p-4 shadow-card">
      <h2 className="mb-3 font-sans text-[15px] font-semibold text-ink">
        {title}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </h2>
      {children}
    </section>
  );
}

function Submitted({ id, onAnother }: { id: string; onAnother: () => void }) {
  const report = useAppStore((s) => s.reports.find((r) => r.id === id));
  const points = useAppStore((s) => s.profile.points);
  const focusOn = useAppStore((s) => s.focusOn);
  const navigate = useNavigate();
  const verified = report?.status === 'verified';
  return (
    <div className="flex flex-1 animate-fade flex-col items-center justify-center px-8 pb-10 text-center">
      <span className={`flex size-20 items-center justify-center rounded-full transition-colors duration-500 ${verified ? 'bg-safe-tint text-safe' : 'bg-tint text-ink'}`}>
        {verified ? <CircleCheck size={40} aria-hidden /> : <span className="size-9 animate-spin rounded-full border-4 border-ink/15 border-t-accent" aria-hidden />}
      </span>
      <h2 className="mt-5 text-[26px] font-bold">{verified ? 'Report verified' : 'Report sent'}</h2>
      <div className="mt-2" aria-live="polite">
        <StatusBadge verified={verified} pendingLabel="Checking with nearby sensors" />
      </div>
      <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-muted">
        {verified
          ? `It’s now on the map for 200+ people nearby. You earned 10 points and have ${points} in total.`
          : `We’re checking it against sensors and other reports. This takes about ${VERIFY_DELAY_MS / 1000} seconds. You’ll get 10 points once it’s verified.`}
      </p>
      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2">
        <Button size="lg" onClick={() => { focusOn({ kind: 'report', id }); navigate('/'); }}>View on map</Button>
        <Button variant="ghost" onClick={onAnother}>Report something else</Button>
      </div>
    </div>
  );
}

/** Resident report flow (CLAUDE.md 3.4), using the Figma report form structure. */
export function ReportScreen() {
  const [params] = useSearchParams();
  const initialStreet = params.get('street');
  const [photo, setPhoto] = useState<string | undefined>();
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [severity, setSeverity] = useState<Exclude<Severity, 'clear'> | null>(null);
  const [location, setLocation] = useState<LocationValue>(() => (initialStreet && locationForStreet(initialStreet)) || CURRENT_REPORT_LOCATION);
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState(true);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const submitReport = useAppStore((s) => s.submitReport);

  const ready = kind && severity && location.text.trim();
  const reset = () => {
    setPhoto(undefined);
    setKind(null);
    setSeverity(null);
    setLocation(CURRENT_REPORT_LOCATION);
    setNote('');
    setSubmittedId(null);
  };
  const submit = () => {
    if (!kind || !severity) return;
    const id = submitReport({
      kind, severity, photoUrl: photo, note: note.trim() || undefined,
      streetName: location.street ?? location.text.replace(/,.*$/, '').trim(),
      segmentId: location.segmentId,
      location: location.position,
    });
    setSubmittedId(id);
  };

  if (submittedId) {
    return (
      <Page>
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white to-sky">
          <Submitted id={submittedId} onAnother={reset} />
        </div>
      </Page>
    );
  }

  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white via-page to-sky">
      <ScreenHeader
        back
        title="Report flooding"
        subtitle={initialStreet ? `Share an update on ${initialStreet}.` : 'Share what you can see. We check every report against sensors and other residents.'}
      />
      <form className="space-y-3 px-4 pb-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Section title="Photo" optional>
          <PhotoPicker value={photo} onChange={setPhoto} />
        </Section>
        <Section title="What’s happening?">
          <OptionGrid label="What’s happening?" options={KINDS} value={kind} onChange={setKind} />
        </Section>
        <Section title="How bad is it?">
          <OptionGrid label="How bad is it?" options={SEVERITIES} value={severity} onChange={setSeverity} />
        </Section>
        <Section title="Location">
          <LocationField value={location} onChange={setLocation} />
        </Section>
        <Section title="Details" optional>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
            rows={3}
            placeholder="For example: water is over the footpath near the tram stop. Cars can pass, people on foot can’t."
            aria-label="Details"
            className="w-full resize-none rounded-control bg-field px-3 py-2.5 text-[15px] text-ink ring-1 ring-accent/20 outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent"
          />
          <p className="mt-1 text-right text-[12px] text-muted tabular-nums">{note.length}/{NOTE_MAX}</p>
        </Section>
        <section className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Allow follow-up contact <span className="font-normal text-muted">(optional)</span></p>
            <p className="text-[13px] text-muted">Council may contact you about this report.</p>
          </div>
          <Toggle checked={followUp} onChange={setFollowUp} label="Allow follow-up contact" />
        </section>

        <div className="flex items-center gap-3 rounded-card border border-accent/15 bg-tint px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-accent"><Award size={20} aria-hidden /></span>
          <div className="min-w-0 text-[14px] leading-snug">
            <p className="font-semibold text-ink">+10 points when it’s verified</p>
            <p className="flex items-center gap-1 text-ink-soft"><Users size={14} aria-hidden /> Helps 200+ people nearby</p>
          </div>
        </div>

        <Button type="submit" variant="accent" size="lg" block disabled={!ready}>Submit report</Button>
        {!ready && <p className="text-center text-[13px] text-muted">Choose what’s happening and how bad it is to submit.</p>}
      </form>
    </div>
    </Page>
  );
}
