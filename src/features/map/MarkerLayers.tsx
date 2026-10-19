import type { DivIcon } from 'leaflet';
import { Fragment } from 'react';
import { Marker, Polyline } from 'react-leaflet';
import { CURRENT_LOCATION } from '../../data/places';
import type { FeatureRef, LatLng } from '../../data/types';
import { POI_LAYER, useAppStore } from '../../store/useAppStore';
import { markFeatureClick } from './mapUi';
import { destinationIcon, poiIcon, reportIcon, sensorIcon, transportIcon, youIcon } from './markers';

function useSelectHandler(ref: FeatureRef) {
  const select = useAppStore((s) => s.select);
  return {
    click: () => {
      markFeatureClick();
      select(ref);
    },
  };
}

const isSel = (sel: FeatureRef | null, kind: FeatureRef['kind'], id: string) => sel?.kind === kind && sel.id === id;

function FeatureMarker({ refId, position, icon, title }: { refId: FeatureRef; position: LatLng; icon: DivIcon; title: string }) {
  const handlers = useSelectHandler(refId);
  return <Marker pane="markerPane" position={position} icon={icon} title={title} alt={title} keyboard eventHandlers={handlers} />;
}

export function ReportLayer() {
  const reports = useAppStore((s) => s.reports);
  const visible = useAppStore((s) => s.layers.reports);
  const sel = useAppStore((s) => s.selected);
  if (!visible) return null;
  return reports.map((r) => (
    <FeatureMarker
      key={r.id}
      refId={{ kind: 'report', id: r.id }}
      position={r.location}
      icon={reportIcon(r.severity, r.status === 'pending', isSel(sel, 'report', r.id))}
      title={`${r.status === 'pending' ? 'Pending' : 'Verified'} report on ${r.streetName}`}
    />
  ));
}

export function SensorLayer() {
  const sensors = useAppStore((s) => s.sensors);
  const visible = useAppStore((s) => s.layers.sensors);
  const sel = useAppStore((s) => s.selected);
  if (!visible) return null;
  return sensors.map((x) => (
    <FeatureMarker
      key={x.id}
      refId={{ kind: 'sensor', id: x.id }}
      position={x.location}
      icon={sensorIcon(x.status === 'triggered', isSel(sel, 'sensor', x.id))}
      title={`${x.label}: ${x.waterLevelCm} cm`}
    />
  ));
}

export function PoiLayer() {
  const pois = useAppStore((s) => s.pois);
  const layers = useAppStore((s) => s.layers);
  const sel = useAppStore((s) => s.selected);
  return pois
    .filter((p) => layers[POI_LAYER[p.type]])
    .map((p) => (
      <FeatureMarker key={p.id} refId={{ kind: 'poi', id: p.id }} position={p.location} icon={poiIcon(p.type, isSel(sel, 'poi', p.id))} title={p.name} />
    ));
}

export function TransportLayer({ force = false }: { force?: boolean }) {
  const transport = useAppStore((s) => s.transport);
  const visible = useAppStore((s) => s.layers.transport);
  const sel = useAppStore((s) => s.selected);
  if (!visible && !force) return null;
  return transport
    .filter((t) => t.active)
    .map((t) => {
      const mid = t.geometry[Math.floor(t.geometry.length / 2)];
      return (
        <Fragment key={t.id}>
          <Polyline
            positions={t.geometry}
            interactive={false}
            pathOptions={{ color: '#da8016', weight: 3.5, opacity: 0.9, dashArray: '7 7', lineCap: 'round' }}
          />
          <FeatureMarker refId={{ kind: 'transport', id: t.id }} position={mid} icon={transportIcon(t.kind, isSel(sel, 'transport', t.id))} title={`${t.route} disruption`} />
        </Fragment>
      );
    });
}

export function YouAreHere() {
  return <Marker position={CURRENT_LOCATION.position} icon={youIcon()} interactive={false} keyboard={false} zIndexOffset={-100} />;
}

export function DestinationMarker({ position, title }: { position: LatLng; title: string }) {
  return <Marker position={position} icon={destinationIcon()} interactive={false} keyboard={false} alt={title} zIndexOffset={500} />;
}
