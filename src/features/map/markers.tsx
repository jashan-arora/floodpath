import L from 'leaflet';
import {
  Bus, Droplet, Flag, Gauge, GlassWater, HardHat, Hospital, House, Navigation2, TramFront, Zap, type LucideIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PointOfInterest, Severity } from '../../data/types';

const cache = new globalThis.Map<string, L.DivIcon>();

function divIcon(key: string, size: [number, number], anchor: [number, number], render: () => ReactElement) {
  let icon = cache.get(key);
  if (!icon) {
    icon = L.divIcon({ html: renderToStaticMarkup(render()), className: 'fp-marker', iconSize: size, iconAnchor: anchor });
    cache.set(key, icon);
  }
  return icon;
}

export const SEVERITY_COLOR: Record<Severity, string> = { flooded: '#e24b4a', caution: '#ef9f27', clear: '#22a06b' };

interface PinProps {
  color: string;
  Icon: LucideIcon;
  size: number;
  solid?: boolean;
  dashed?: boolean;
  halo?: boolean;
  selected?: boolean;
}

/** Figma's circular map marker: coloured disc, white ring, white glyph. */
function Pin({ color, Icon, size, solid = true, dashed, halo, selected }: PinProps) {
  return (
    <span className="fp-marker-btn relative block" data-selected={selected} style={{ width: size, height: size }}>
      {halo && <span className="fp-halo absolute inset-0 rounded-full" style={{ background: color }} />}
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full border-2 shadow-[0_2px_6px_rgb(15_42_63/0.35)]"
        style={{
          background: solid ? color : '#fff',
          borderColor: solid ? '#fff' : color,
          borderStyle: dashed ? 'dashed' : 'solid',
          color: solid ? '#fff' : color,
        }}
      >
        <Icon size={Math.round(size * 0.5)} strokeWidth={2.4} />
      </span>
      {selected && <span className="absolute -inset-[5px] rounded-full border-2 border-ink" />}
    </span>
  );
}

function pin(key: string, p: PinProps) {
  return divIcon(`${key}:${p.selected ? 1 : 0}`, [p.size, p.size], [p.size / 2, p.size / 2], () => <Pin {...p} />);
}

export const reportIcon = (severity: Exclude<Severity, 'clear'>, pending: boolean, selected: boolean) =>
  pin(`report:${severity}:${pending}`, {
    color: SEVERITY_COLOR[severity], Icon: Droplet, size: 30, solid: !pending, dashed: pending, halo: pending, selected,
  });

export const sensorIcon = (triggered: boolean, selected: boolean) =>
  pin(`sensor:${triggered}`, { color: triggered ? SEVERITY_COLOR.flooded : '#2563eb', Icon: Gauge, size: 28, solid: triggered, halo: triggered, selected });

export const POI_STYLE: Record<PointOfInterest['type'], { color: string; Icon: LucideIcon; label: string }> = {
  shelter: { color: '#0f6e56', Icon: House, label: 'Shelter' },
  medical: { color: '#c11574', Icon: Hospital, label: 'Medical' },
  power: { color: '#6e4ff6', Icon: Zap, label: 'Charging and power' },
  water: { color: '#0e7490', Icon: GlassWater, label: 'Drinking water' },
  repair_crew: { color: '#475467', Icon: HardHat, label: 'Repair crew' },
};

export const poiIcon = (type: PointOfInterest['type'], selected: boolean) =>
  pin(`poi:${type}`, { ...POI_STYLE[type], size: 30, selected });

export const transportIcon = (kind: 'tram' | 'bus', selected: boolean) =>
  pin(`transport:${kind}`, { color: '#da8016', Icon: kind === 'tram' ? TramFront : Bus, size: 30, selected });

export const youIcon = () =>
  divIcon('you', [22, 22], [11, 11], () => (
    <span className="relative block size-[22px]">
      <span className="fp-halo absolute inset-0 rounded-full bg-accent" />
      <span className="absolute inset-[3px] rounded-full border-[3px] border-white bg-accent shadow-[0_1px_4px_rgb(15_42_63/0.4)]" />
    </span>
  ));

export const destinationIcon = () =>
  divIcon('dest', [34, 42], [17, 40], () => (
    <span className="relative block h-[42px] w-[34px]">
      <svg viewBox="0 0 34 42" className="absolute inset-0 drop-shadow-[0_2px_3px_rgb(15_42_63/0.35)]">
        <path d="M17 41C17 41 32 26.5 32 16.5C32 8 25.3 1.5 17 1.5S2 8 2 16.5C2 26.5 17 41 17 41Z" fill="#183b56" stroke="#fff" strokeWidth="2.5" />
      </svg>
      <span className="absolute inset-x-0 top-[8px] flex justify-center text-white">
        <Flag size={16} strokeWidth={2.6} />
      </span>
    </span>
  ));

/** Navigation puck. The arrow element is rotated imperatively each frame. */
export const navIcon = () =>
  divIcon('nav', [40, 40], [20, 20], () => (
    <span className="relative block size-10">
      <span className="absolute inset-0 rounded-full bg-accent/20" />
      <span className="absolute inset-[5px] flex items-center justify-center rounded-full border-[3px] border-white bg-ink shadow-[0_2px_8px_rgb(15_42_63/0.45)]">
        <span className="fp-puck-arrow flex text-white transition-transform duration-150">
          <Navigation2 size={16} strokeWidth={2.4} fill="currentColor" />
        </span>
      </span>
    </span>
  ));
