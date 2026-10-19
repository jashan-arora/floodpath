import { JOURNEY_ROUTES, WAYPOINTS } from './geo.generated';
import type { Journey } from './types';

/** The three demo journeys from the mock current location (CLAUDE.md section 7). */
export const JOURNEYS: Journey[] = [
  {
    id: 'j-fss', destination: 'Flinders St Station', area: 'Melbourne CBD', location: WAYPOINTS.FSS,
    keywords: ['flinders', 'station', 'train', 'fed square', 'federation square', 'city'],
    routes: JOURNEY_ROUTES['j-fss'],
  },
  {
    id: 'j-qvm', destination: 'Queen Victoria Market', area: 'Melbourne CBD', location: WAYPOINTS.DEST_QVM,
    keywords: ['queen victoria', 'market', 'qvm', 'vic market'],
    routes: JOURNEY_ROUTES['j-qvm'],
  },
  {
    id: 'j-rmh', destination: 'Royal Melbourne Hospital', area: 'Parkville', location: WAYPOINTS.GRATTAN_RP,
    keywords: ['royal melbourne', 'hospital', 'rmh', 'parkville', 'emergency'],
    routes: JOURNEY_ROUTES['j-rmh'],
  },
];

export const journeyById = (id: string | null | undefined) => JOURNEYS.find((j) => j.id === id);
