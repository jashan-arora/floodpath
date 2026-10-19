import { ChevronDown, Droplet, Gauge, House, TramFront } from 'lucide-react';
import { useState } from 'react';

function Line({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <span aria-hidden className="inline-block h-[5px] w-4 rounded-full" style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` : color }} />
  );
}

/** Legend chip (CLAUDE.md 3.1: Flooded, Caution, Shelter). Expands to the full key. */
export function Legend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto max-w-[260px] rounded-[14px] bg-white/95 text-[12px] font-medium text-ink shadow-card backdrop-blur">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-8 items-center gap-2.5 px-3">
        <span className="flex items-center gap-1.5"><Line color="#e24b4a" />Flooded</span>
        <span className="flex items-center gap-1.5"><Line color="#ef9f27" />Caution</span>
        <span className="flex items-center gap-1.5"><House size={13} className="text-safe" aria-hidden />Shelter</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        <span className="sr-only">{open ? 'Hide full legend' : 'Show full legend'}</span>
      </button>
      {open && (
        <ul className="grid animate-fade grid-cols-2 gap-x-3 gap-y-1.5 border-t border-line px-3 py-2.5 text-muted">
          <li className="flex items-center gap-1.5"><Line color="#22a06b" />Open</li>
          <li className="flex items-center gap-1.5"><Line color="#da8016" dashed />Disruption</li>
          <li className="flex items-center gap-1.5"><Droplet size={13} className="text-flooded" aria-hidden />Report</li>
          <li className="flex items-center gap-1.5"><Droplet size={13} className="text-caution" strokeDasharray="3 2" aria-hidden />Checking</li>
          <li className="flex items-center gap-1.5"><Gauge size={13} className="text-sensor" aria-hidden />Sensor</li>
          <li className="flex items-center gap-1.5"><TramFront size={13} className="text-transit" aria-hidden />Tram or bus</li>
          <li className="col-span-2 flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-white bg-accent shadow" aria-hidden />You are here</li>
          <li className="col-span-2 pt-1 text-[11px] text-subtle">Map © OpenStreetMap contributors</li>
        </ul>
      )}
    </div>
  );
}
