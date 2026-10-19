import { MapContainer, Pane, TileLayer } from 'react-leaflet';
import { MAP_CENTER, MAP_ZOOM } from '../../data/places';
import { useAppStore } from '../../store/useAppStore';
import { FloodLayer } from './FloodLayer';
import { MapController, type MapMode } from './MapController';
import { PoiLayer, ReportLayer, SensorLayer, TransportLayer, YouAreHere } from './MarkerLayers';
import { NavLayer, PlanRoutes } from './RouteLayer';
import { MapBridge } from './useMap';

/** One Leaflet map shared by the home, search, route and navigation screens. */
export function MapView({ mode }: { mode: MapMode }) {
  const transit = useAppStore((s) => (mode === 'nav' ? s.nav.mode : s.mode) === 'transit');
  const planning = mode === 'plan';
  const navigating = mode === 'nav';

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      minZoom={12}
      maxZoom={19}
      zoomControl={false}
      attributionControl={false}
      className="absolute inset-0 z-0"
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
      {/* Comparing routes: flood lines sit on top so blocked stretches show red.
          Navigating: the active route sits on top so it is never hidden. */}
      <Pane name="routes" style={{ zIndex: 405 }}>
        {mode === 'plan' && <PlanRoutes />}
      </Pane>
      <Pane name="nav-route" style={{ zIndex: 420 }}>
        {navigating && <NavLayer />}
      </Pane>
      <Pane name="transport" style={{ zIndex: 410 }}>
        {mode === 'home' ? <TransportLayer /> : transit && <TransportLayer force />}
      </Pane>
      <Pane name="flood" style={{ zIndex: 415 }}>
        <FloodLayer force={planning || navigating} interactive={mode === 'home'} />
      </Pane>
      {mode === 'home' && (
        <>
          <PoiLayer />
          <SensorLayer />
        </>
      )}
      {mode === 'home' && <ReportLayer />}
      {!navigating && <YouAreHere />}
      <MapController mode={mode} />
      <MapBridge />
    </MapContainer>
  );
}
