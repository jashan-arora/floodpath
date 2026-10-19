import { ChevronRight, FileText, Siren, TramFront, TriangleAlert, Wrench, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Page } from '../../components/Panel';
import { timeAgo } from '../../lib/format';
import { useNow } from '../../store/simulation';
import { FILTER_LAYERS, useAppStore } from '../../store/useAppStore';
import { Skyline } from './Skyline';

function Tile({ Icon, tint, title, detail, onClick }: { Icon: LucideIcon; tint: string; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="relative flex flex-col items-start rounded-card bg-white p-4 text-left shadow-card transition hover:shadow-float active:scale-[0.98]">
      <span className={`flex size-11 items-center justify-center rounded-full ${tint}`}>
        <Icon size={22} strokeWidth={2.2} aria-hidden />
      </span>
      <ChevronRight size={16} className="absolute top-4 right-3.5 text-ink-soft" aria-hidden />
      <span className="mt-3 block text-[15px] leading-tight font-semibold">{title}</span>
      <span className="mt-1 block text-[12.5px] leading-snug text-muted">{detail}</span>
    </button>
  );
}

/** The Figma "Southbank Recovery Hub" homepage, now a tab. Tiles open the map with the right layers. */
export function HubScreen() {
  const navigate = useNavigate();
  const alerts = useAppStore((s) => s.alerts);
  const segments = useAppStore((s) => s.segments);
  const focusOn = useAppStore((s) => s.focusOn);
  const showLayers = useAppStore((s) => s.showLayers);
  const now = useNow();

  const latest = useMemo(() => {
    const alert = alerts.find((a) => a.severity !== 'clear') ?? alerts[0];
    if (alert) return { title: alert.title, when: alert.createdAt, body: alert.body, target: alert.target };
    const seg = segments.find((s) => s.severity === 'flooded');
    return seg ? { title: `Flooding on ${seg.streetName}`, when: seg.updatedAt, body: seg.note, target: { kind: 'segment' as const, id: seg.id } } : null;
  }, [alerts, segments]);

  const openLatest = () => {
    if (latest?.target) focusOn(latest.target);
    navigate('/');
  };

  return (
    <Page>
    <div className="min-h-0 flex-1 overflow-y-auto bg-page">
      <div className="relative h-[250px]">
        <Skyline />
        <div className="relative px-5 pt-8">
          <h1 className="max-w-[11ch] text-[34px] leading-[1.05] font-bold tracking-[-0.015em] text-ink">Southbank Recovery Hub</h1>
          <p className="mt-2 text-[15px] text-ink-soft">For a safer, stronger Southbank.</p>
        </div>
      </div>

      <div className="relative -mt-8 space-y-3 px-4 pb-6">
        {latest && (
          <button type="button" onClick={openLatest} className="flex w-full items-center gap-3.5 rounded-card bg-white p-4 text-left shadow-card transition hover:shadow-float active:scale-[0.99]">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-flooded-tint text-flooded">
              <TriangleAlert size={24} strokeWidth={2.3} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-flooded-ink">Latest update</span>
              <span className="mt-0.5 block text-[17px] leading-snug font-semibold">{latest.title}</span>
              <span className="mt-0.5 block text-[13px] text-muted">Updated {timeAgo(latest.when, now)}. Tap to see it on the map.</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Tile Icon={Siren} tint="bg-flooded-tint text-flooded" title="Emergency services" detail="Contacts and support services" onClick={() => navigate('/hub/emergency')} />
          <Tile Icon={TramFront} tint="bg-tint text-ink" title="Road and transport" detail="Closures and public transport" onClick={() => { showLayers(['floodZones', 'transport']); navigate('/'); }} />
          <Tile Icon={Wrench} tint="bg-tint text-ink" title="Essential services" detail="Shelters, power, water and health" onClick={() => { showLayers(FILTER_LAYERS.services); navigate('/'); }} />
          <Tile Icon={FileText} tint="bg-tint text-ink" title="Further information" detail="Recovery resources and official updates" onClick={() => navigate('/hub/info')} />
        </div>

        <p className="px-1 pt-2 text-[12.5px] leading-relaxed text-muted">
          Council data, sensors and resident reports in one place. FloodPath adds local detail that national map apps don’t carry: tram disruptions, shelters and repair crews.
        </p>
      </div>
    </div>
    </Page>
  );
}
