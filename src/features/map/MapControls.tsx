import { Gauge, Layers, LocateFixed, Minus, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { IconButton } from '../../components/IconButton';
import { Logo } from '../../components/Logo';
import { CURRENT_LOCATION } from '../../data/places';
import { timeAgo } from '../../lib/format';
import { useNow } from '../../store/simulation';
import { useAppStore } from '../../store/useAppStore';
import { FilterChips } from './FilterChips';
import { LayerPanel } from './LayerPanel';
import { Legend } from './Legend';
import { useInset, useMapUi } from './mapUi';
import { useMap } from './useMap';

export function LiveStatus({ short = false }: { short?: boolean }) {
  const updated = useAppStore((s) => s.lastUpdatedAt);
  const live = useAppStore((s) => s.autoUpdates);
  const now = useNow(10_000);
  return (
    <span className="flex items-center gap-1.5 truncate">
      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${live ? 'bg-clear' : 'bg-subtle'}`} />
      {short ? 'Updated' : 'Southbank, updated'} {timeAgo(updated, now)}
    </span>
  );
}

export function FloodedCount() {
  const flooded = useAppStore((s) => s.segments.filter((g) => g.severity === 'flooded').length);
  return (
    <span className="shrink-0 rounded-full bg-flooded-tint px-2.5 py-1 text-[12px] font-semibold text-flooded-ink">{flooded} flooded</span>
  );
}

/** Phone top bar: app name, live status, flooded count, layers. */
export function TopBar({ onLayers }: { onLayers: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] bg-white/95 p-2 shadow-card backdrop-blur">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-ink">
        <Logo />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-[19px] leading-none font-bold tracking-[-0.01em]">FloodPath</h1>
        <p className="mt-1 text-[12.5px] text-muted"><LiveStatus short /></p>
      </div>
      <FloodedCount />
      <IconButton label="Map layers" tone="plain" onClick={onLayers}>
        <Layers size={20} />
      </IconButton>
    </div>
  );
}

export function SensorShortcut() {
  const triggered = useAppStore((s) => s.sensors.filter((x) => x.status === 'triggered').length);
  const sensorsOn = useAppStore((s) => s.layers.sensors);
  const toggle = useAppStore((s) => s.toggleLayer);
  return (
    <button
      type="button"
      aria-pressed={sensorsOn}
      onClick={() => toggle('sensors')}
      className={`pointer-events-auto flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap shadow-card transition active:scale-95 ${sensorsOn ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-page'}`}
    >
      <Gauge size={16} aria-hidden />
      Sensors
      {triggered > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-flooded px-1.5 text-[11px] text-white tabular-nums">{triggered}</span>}
      <span className="sr-only">{triggered} above threshold</span>
    </button>
  );
}

export function LocateButton() {
  const map = useMap();
  const locate = () => {
    if (!map) return;
    const { top, bottom } = useMapUi.getState();
    const z = Math.max(map.getZoom(), 16);
    map.flyTo(map.unproject(map.project(CURRENT_LOCATION.position, z).add([0, (bottom - top) / 2]), z), z, { duration: 0.6 });
  };
  return (
    <IconButton label="Show my location" className="pointer-events-auto" onClick={locate}>
      <LocateFixed size={20} />
    </IconButton>
  );
}

function ZoomButtons() {
  const map = useMap();
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-full bg-white shadow-card">
      <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()} className="flex size-10 items-center justify-center text-ink hover:bg-page active:bg-tint">
        <Plus size={18} />
      </button>
      <span className="mx-2.5 h-px bg-line" />
      <button type="button" aria-label="Zoom out" onClick={() => map?.zoomOut()} className="flex size-10 items-center justify-center text-ink hover:bg-page active:bg-tint">
        <Minus size={18} />
      </button>
    </div>
  );
}

/** Laptop map overlay: quick filters and layers on top, legend and map buttons below. */
export function DesktopMapControls() {
  const [layersOpen, setLayersOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useInset(top, 'top');
  useInset(bottom, 'bottom');
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div ref={top} className="flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto">
          <FilterChips stretch={false} />
        </div>
        <button
          type="button"
          onClick={() => setLayersOpen(true)}
          className="pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-ink shadow-card transition hover:bg-page active:scale-95"
        >
          <Layers size={18} aria-hidden />
          Layers
        </button>
      </div>
      <div className="flex-1" />
      <div ref={bottom} className="flex items-end justify-between gap-3 p-4">
        <Legend />
        <div className="flex items-end gap-2">
          <SensorShortcut />
          <div className="flex flex-col items-center gap-2">
            <ZoomButtons />
            <LocateButton />
          </div>
        </div>
      </div>
      {layersOpen && <LayerPanel onClose={() => setLayersOpen(false)} />}
    </div>
  );
}
