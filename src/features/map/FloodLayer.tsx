import { Fragment } from 'react';
import { Polyline } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { markFeatureClick } from './mapUi';
import { SEVERITY_COLOR } from './markers';

const ROUND = { lineCap: 'round', lineJoin: 'round' } as const;

/** Flood segments as coloured street lines. Flooded streets get moving "water" dots. */
export function FloodLayer({ force = false, interactive = true }: { force?: boolean; interactive?: boolean }) {
  const segments = useAppStore((s) => s.segments);
  const visible = useAppStore((s) => s.layers.floodZones);
  const selected = useAppStore((s) => s.selected);
  const flash = useAppStore((s) => s.flash);
  const select = useAppStore((s) => s.select);
  if (!visible && !force) return null;

  return segments.map((seg) => {
    const color = SEVERITY_COLOR[seg.severity];
    const isSelected = selected?.kind === 'segment' && selected.id === seg.id;
    return (
      <Fragment key={seg.id}>
        <Polyline positions={seg.geometry} interactive={false} pathOptions={{ ...ROUND, color: '#ffffff', weight: isSelected ? 15 : 11, opacity: 0.95 }} />
        <Polyline positions={seg.geometry} interactive={false} pathOptions={{ ...ROUND, color, weight: isSelected ? 10 : 6.5, opacity: 1 }} />
        {seg.severity === 'flooded' && (
          <Polyline
            key={`${seg.id}-flow`}
            positions={seg.geometry}
            interactive={false}
            // className must be a constructor option: react-leaflet applies pathOptions via setStyle, which ignores it
            className="fp-flow"
            pathOptions={{ ...ROUND, color: '#ffffff', weight: 2.6, opacity: 0.95, dashArray: '0.5 13' }}
          />
        )}
        {flash?.segmentId === seg.id && (
          <Polyline
            key={`flash-${flash.nonce}`}
            positions={seg.geometry}
            interactive={false}
            className="fp-flash"
            pathOptions={{ ...ROUND, color, weight: 10, opacity: 0 }}
          />
        )}
        {interactive && (
          <Polyline
            positions={seg.geometry}
            pathOptions={{ ...ROUND, color: '#000000', weight: 26, opacity: 0 }}
            eventHandlers={{
              click: () => {
                markFeatureClick();
                select({ kind: 'segment', id: seg.id });
              },
            }}
          />
        )}
      </Fragment>
    );
  });
}
