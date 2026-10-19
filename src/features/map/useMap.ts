import type { Map as LMap } from 'leaflet';
import { useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import { create } from 'zustand';

/** Overlays live outside <MapContainer>, so the Leaflet instance is shared through this tiny store. */
const useMapInstance = create<{ map: LMap | null }>()(() => ({ map: null }));

export const useMap = () => useMapInstance((s) => s.map);

/** Rendered inside <MapContainer>; publishes the map instance. */
export function MapBridge() {
  const map = useLeafletMap();
  useEffect(() => {
    useMapInstance.setState({ map });
    return () => useMapInstance.setState({ map: null });
  }, [map]);
  return null;
}
