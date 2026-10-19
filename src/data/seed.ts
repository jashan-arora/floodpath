import { createAlerts } from './alerts';
import { POIS } from './pois';
import { createReports } from './reports';
import { createSegments } from './segments';
import { createSensors } from './sensors';
import { createTransport } from './transport';
import type { AppAlert, FloodSegment, PointOfInterest, ResidentReport, Sensor, TramDisruption, UserProfile } from './types';

export interface SeedData {
  segments: FloodSegment[];
  reports: ResidentReport[];
  sensors: Sensor[];
  pois: PointOfInterest[];
  transport: TramDisruption[];
  alerts: AppAlert[];
  profile: UserProfile;
}

/** Fresh demo state. Called on load and on "Reset demo", so timestamps are relative to now. */
export function createSeed(now: number = Date.now()): SeedData {
  return {
    segments: createSegments(now),
    reports: createReports(now),
    sensors: createSensors(now),
    pois: POIS,
    transport: createTransport(now),
    alerts: createAlerts(now),
    profile: {
      name: 'Sam Rivera',
      points: 120,
      homeAddress: 'Sturt St, Southbank',
      workAddress: 'Flinders St Station',
      savedRoutes: ['j-fss'],
    },
  };
}
