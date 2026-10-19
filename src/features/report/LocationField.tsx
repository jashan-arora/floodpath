import { LocateFixed, MapPin } from 'lucide-react';
import { useId, useState } from 'react';
import { CURRENT_LOCATION, REPORT_STREETS } from '../../data/places';
import type { LatLng } from '../../data/types';

export interface LocationValue {
  text: string;
  street?: string;
  segmentId?: string;
  position: LatLng;
}

export const CURRENT_REPORT_LOCATION: LocationValue = {
  text: 'Sturt St, Southbank (your location)',
  street: REPORT_STREETS[0].street,
  segmentId: REPORT_STREETS[0].segmentId,
  position: REPORT_STREETS[0].position,
};

export function locationForStreet(street: string): LocationValue | null {
  const s = REPORT_STREETS.find((x) => x.street.toLowerCase() === street.toLowerCase());
  return s ? { text: `${s.street}, ${s.area}`, street: s.street, segmentId: s.segmentId, position: s.position } : null;
}

/** Location, prefilled with the mock current location and editable (CLAUDE.md 3.4). */
export function LocationField({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const q = value.text.toLowerCase();
  const typed = !value.street;
  const suggestions = REPORT_STREETS.filter((s) => !typed || !q || s.street.toLowerCase().includes(q.replace(/,.*$/, '').trim()));

  return (
    <div className="relative">
      <div className="flex h-12 items-center gap-2 rounded-control bg-field px-3 ring-1 ring-accent/20 focus-within:ring-2 focus-within:ring-accent">
        <MapPin size={18} className="shrink-0 text-ink-soft" aria-hidden />
        <input
          value={value.text}
          onChange={(e) => onChange({ text: e.target.value, position: CURRENT_LOCATION.position })}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Enter a street in Southbank"
          aria-label="Location"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle"
        />
        <button
          type="button"
          onClick={() => onChange(CURRENT_REPORT_LOCATION)}
          aria-label="Use my current location"
          title="Use my current location"
          className="-mr-1.5 rounded-full p-1.5 text-ink hover:bg-tint"
        >
          <LocateFixed size={20} />
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[52px] z-10 max-h-56 animate-fade overflow-y-auto rounded-control bg-white py-1 shadow-float ring-1 ring-line">
          {suggestions.map((s) => (
            <li key={s.street} role="option" aria-selected={value.street === s.street}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ text: `${s.street}, ${s.area}`, street: s.street, segmentId: s.segmentId, position: s.position });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] hover:bg-page"
              >
                <MapPin size={15} className="text-muted" aria-hidden />
                {s.street}
                <span className="text-muted">, {s.area}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
