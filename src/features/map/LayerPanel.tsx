import { Droplet, Gauge, TramFront, Waves, X, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Toggle } from '../../components/Toggle';
import type { LatLng, PointOfInterest } from '../../data/types';
import { DEFAULT_LAYERS, LAYER_KEYS, POI_LAYER, useAppStore, type LayerKey } from '../../store/useAppStore';
import { POI_STYLE } from './markers';

interface Row { key: LayerKey; label: string; hint: string; Icon: LucideIcon; color: string }

const poiRow = (type: PointOfInterest['type'], label: string, hint: string): Row => ({
  key: POI_LAYER[type], label, hint, Icon: POI_STYLE[type].Icon, color: POI_STYLE[type].color,
});

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Flooding',
    rows: [
      { key: 'floodZones', label: 'Flood zones', hint: 'Flooded, caution and reopened streets', Icon: Waves, color: '#e24b4a' },
      { key: 'reports', label: 'Resident reports', hint: 'Photos and reports from neighbours', Icon: Droplet, color: '#2563eb' },
      { key: 'sensors', label: 'Water level sensors', hint: 'Council drain and river gauges', Icon: Gauge, color: '#2563eb' },
    ],
  },
  {
    title: 'Getting around',
    rows: [{ key: 'transport', label: 'Tram and bus disruptions', hint: 'Yarra Trams and Transport Victoria', Icon: TramFront, color: '#da8016' }],
  },
  {
    title: 'Services',
    rows: [
      poiRow('shelter', 'Shelters', 'Relief centres with beds and meals'),
      poiRow('medical', 'Medical services', 'Clinics, first aid and hospitals'),
      poiRow('power', 'Charging and backup power', 'Phone and medical-device charging'),
      poiRow('water', 'Drinking water', 'Refill stations and handouts'),
      poiRow('repair_crew', 'Repair crews', 'Where council crews are working'),
    ],
  },
];

/** CLAUDE.md 3.5 layers panel, as a sheet over the map. */
export function LayerPanel({ onClose: close }: { onClose: () => void }) {
  const layers = useAppStore((s) => s.layers);
  const opening = useRef(layers);
  // On close, frame anything that was just switched on so it isn't off-screen.
  const onClose = useCallback(() => {
    const s = useAppStore.getState();
    const added = LAYER_KEYS.filter((k) => s.layers[k] && !opening.current[k]);
    const points: LatLng[] = [];
    for (const k of added) {
      if (k === 'sensors') points.push(...s.sensors.map((x) => x.location));
      for (const p of s.pois) if (POI_LAYER[p.type] === k) points.push(p.location);
    }
    // keep framing local: leave out far-off places such as the Parkville hospital
    s.fitTo(points.filter((p) => p[0] < -37.81));
    close();
  }, [close]);
  const toggle = useAppStore((s) => s.toggleLayer);
  const counts = useAppStore(useShallow((s): Record<LayerKey, number> => ({
    floodZones: s.segments.filter((g) => g.severity !== 'clear').length,
    reports: s.reports.length,
    sensors: s.sensors.length,
    transport: s.transport.filter((t) => t.active).length,
    shelters: s.pois.filter((p) => p.type === 'shelter').length,
    medical: s.pois.filter((p) => p.type === 'medical').length,
    power: s.pois.filter((p) => p.type === 'power').length,
    water: s.pois.filter((p) => p.type === 'water').length,
    repairCrews: s.pois.filter((p) => p.type === 'repair_crew').length,
  })));
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const resetToDefault = () => {
    for (const k of Object.keys(DEFAULT_LAYERS) as LayerKey[]) if (layers[k] !== DEFAULT_LAYERS[k]) toggle(k);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col justify-end lg:items-end lg:justify-start lg:p-4">
      <button type="button" aria-hidden tabIndex={-1} className="absolute inset-0 animate-fade cursor-default bg-ink-deep/35 lg:bg-ink-deep/10" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="layers-title" className="relative max-h-[86%] animate-rise overflow-y-auto rounded-t-sheet bg-white px-5 pt-4 pb-6 shadow-sheet lg:max-h-full lg:w-[380px] lg:rounded-sheet lg:shadow-float">
        <div className="flex items-center justify-between">
          <h2 id="layers-title" className="text-xl font-semibold">Map layers</h2>
          <IconButton ref={closeRef} label="Close layers" tone="plain" onClick={onClose}><X size={20} /></IconButton>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title} className="mt-4">
            <h3 className="mb-1 font-sans text-[13px] font-semibold text-muted">{g.title}</h3>
            <ul className="divide-y divide-line">
              {g.rows.map((r) => (
                <li key={r.key} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: r.color }}>
                    <r.Icon size={17} strokeWidth={2.3} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight">
                      {r.label} <span className="font-normal text-subtle tabular-nums">{counts[r.key]}</span>
                    </p>
                    <p className="text-[13px] leading-snug text-muted">{r.hint}</p>
                  </div>
                  <Toggle checked={layers[r.key]} onChange={() => toggle(r.key)} label={r.label} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={resetToDefault} disabled={LAYER_KEYS.every((k) => layers[k] === DEFAULT_LAYERS[k])}>
          Reset to default layers
        </Button>
      </section>
    </div>
  );
}
