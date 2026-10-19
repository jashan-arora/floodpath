import { CloudRain, Gauge, RotateCcw, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Toggle } from '../../components/Toggle';
import { journeyById } from '../../data/journeys';
import { segmentAhead } from '../../store/navigation';
import { useAppStore, type AppState } from '../../store/useAppStore';

/** The flood that makes the best demo right now: the next closable street on the active route, else St Kilda Rd. */
function suggestedSegment(s: AppState): string | undefined {
  const open = s.segments.filter((g) => g.severity !== 'flooded');
  if (s.nav.status === 'active') {
    const route = journeyById(s.nav.journeyId)?.routes.find((r) => r.id === s.nav.routeId);
    const ahead = route?.blockedSegmentIds
      .map((id) => open.find((g) => g.id === id))
      .find((g) => g && segmentAhead(s.nav, g));
    if (ahead) return ahead.id;
  }
  return (open.find((g) => g.id === 'seg-stkr') ?? open[0])?.id;
}

function isTyping(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/** Shift+D toggles the panel. Ignored while typing so a capital D still works in fields. */
export function useDemoHotkey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'd' && !isTyping(e.target)) {
        e.preventDefault();
        const s = useAppStore.getState();
        s.setDemoOpen(!s.demoOpen);
      }
      if (e.key === 'Escape' && useAppStore.getState().demoOpen) useAppStore.getState().setDemoOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Barely visible corner dot for touch screens, where there is no keyboard. */
export function DemoCornerButton() {
  const setOpen = useAppStore((s) => s.setDemoOpen);
  const open = useAppStore((s) => s.demoOpen);
  return (
    <button
      type="button"
      aria-label="Demo controls"
      onClick={() => setOpen(!open)}
      className="absolute top-0 left-0 z-40 flex size-6 items-center justify-center opacity-25 hover:opacity-80 focus-visible:opacity-100"
    >
      <span className="size-1.5 rounded-full bg-ink" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-white/60">{label}</p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

const selectCls = 'h-9 min-w-0 flex-1 rounded-[10px] bg-white/10 px-2 text-[13px] text-white outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-[#8cc8f5] [&>option]:text-ink';
const actionCls = 'flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold transition active:scale-95 disabled:opacity-40';

/** Hidden presenter controls (CLAUDE.md section 8). */
export function DemoPanel() {
  const s = useAppStore();
  const navigate = useNavigate();
  const suggested = useMemo(() => suggestedSegment(s), [s]);
  const [segId, setSegId] = useState<string>('');
  const [sensorId, setSensorId] = useState<string>('');
  const openSegments = s.segments.filter((g) => g.severity !== 'flooded');
  const normalSensors = s.sensors.filter((x) => x.status === 'normal');
  const seg = openSegments.find((g) => g.id === segId)?.id ?? suggested;
  const sensor = normalSensors.find((x) => x.id === sensorId)?.id ?? normalSensors[0]?.id;

  if (!s.demoOpen) return null;
  const navLine =
    s.nav.status === 'active'
      ? `Navigating, ${Math.round((s.nav.travelled / s.nav.total) * 100)}% of the way${s.nav.paused ? ' (paused)' : ''}`
      : s.nav.status === 'arrived' ? 'Arrived' : 'Not navigating';

  return (
    <aside
      aria-label="Demo controls"
      className="fixed inset-x-3 top-12 z-[100] animate-drop rounded-card bg-ink-deep/95 p-4 text-white shadow-float ring-1 ring-white/10 backdrop-blur md:inset-x-auto md:top-6 md:right-6 md:w-[300px]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[16px] font-semibold">Demo controls</p>
          <p className="text-[12px] text-white/55">Shift+D to hide. {navLine}.</p>
        </div>
        <button type="button" aria-label="Close demo controls" onClick={() => s.setDemoOpen(false)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-3.5">
        <Field label="New flooding">
          <select aria-label="Street to flood" className={selectCls} value={seg ?? ''} onChange={(e) => setSegId(e.target.value)} disabled={!openSegments.length}>
            {openSegments.map((g) => (
              <option key={g.id} value={g.id}>{g.streetName}{g.id === suggested ? ' (suggested)' : ''}</option>
            ))}
          </select>
          <button type="button" disabled={!seg} onClick={() => seg && s.triggerFlooding(seg)} className={`${actionCls} bg-flooded text-white hover:bg-[#cf3f3e]`}>
            <CloudRain size={15} aria-hidden /> Flood it
          </button>
        </Field>

        <Field label="Sensor threshold exceeded">
          <select aria-label="Sensor" className={selectCls} value={sensor ?? ''} onChange={(e) => setSensorId(e.target.value)} disabled={!normalSensors.length}>
            {normalSensors.length ? normalSensors.map((x) => <option key={x.id} value={x.id}>{x.label}</option>) : <option>All sensors triggered</option>}
          </select>
          <button type="button" disabled={!sensor} onClick={() => sensor && s.triggerSensorAlert(sensor)} className={`${actionCls} bg-caution text-ink-deep hover:bg-[#f4b04a]`}>
            <Gauge size={15} aria-hidden /> Trigger
          </button>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={s.clearAllFlooding} className={`${actionCls} justify-center bg-white/10 hover:bg-white/15`}>
            <Sun size={15} aria-hidden /> Clear flooding
          </button>
          <button
            type="button"
            onClick={() => {
              s.resetDemo();
              s.setDemoOpen(true);
              navigate('/');
            }}
            className={`${actionCls} justify-center bg-white/10 hover:bg-white/15`}
          >
            <RotateCcw size={15} aria-hidden /> Reset demo
          </button>
        </div>

        {s.nav.status === 'active' && (
          <div className="flex items-center justify-between rounded-[10px] bg-white/5 px-3 py-2">
            <span className="text-[13px]">Pause navigation</span>
            <Toggle checked={s.nav.paused} onChange={s.setNavPaused} label="Pause navigation" />
          </div>
        )}
        <div className="flex items-center justify-between rounded-[10px] bg-white/5 px-3 py-2">
          <span className="text-[13px]">Auto updates every 30 s</span>
          <Toggle checked={s.autoUpdates} onChange={s.setAutoUpdates} label="Auto updates" />
        </div>
      </div>
    </aside>
  );
}
