import { SEGMENT_MIDPOINTS, WAYPOINTS } from './geo.generated';
import type { LatLng } from './types';

/** Fixed mock "current location". No real geolocation is used. */
export const CURRENT_LOCATION: { label: string; area: string; position: LatLng } = {
  label: 'Sturt St & Grant St',
  area: 'Southbank, near ACCA',
  position: WAYPOINTS.ORIGIN,
};

/** Where the map opens: Southbank between the Arts Precinct and City Rd. */
export const MAP_CENTER: LatLng = [-37.8226, 144.9672];
export const MAP_ZOOM = 16;

/** Streets a resident can pick as a report location. The first is the mock current location. */
export const REPORT_STREETS: { street: string; area: string; segmentId: string; position: LatLng }[] = [
  { street: 'Sturt St', segmentId: 'seg-sturt-south' },
  { street: 'Southbank Blvd', segmentId: 'seg-sbb' },
  { street: 'St Kilda Rd', segmentId: 'seg-stkr' },
  { street: 'Dodds St', segmentId: 'seg-dodds' },
  { street: 'City Rd', segmentId: 'seg-cityrd' },
  { street: 'Southbank Promenade', segmentId: 'seg-promenade' },
  { street: 'Kings Way', segmentId: 'seg-kingsway' },
  { street: 'Power St', segmentId: 'seg-power' },
  { street: 'Flinders St', segmentId: 'seg-flinders' },
  { street: 'Elizabeth St', segmentId: 'seg-elizabeth' },
].map((s) => ({
  ...s,
  area: s.street === 'Flinders St' || s.street === 'Elizabeth St' ? 'Melbourne' : 'Southbank',
  position: SEGMENT_MIDPOINTS[s.segmentId],
}));
