import { SEGMENT_MIDPOINTS } from './geo.generated';
import { minutesAgo } from './time';
import type { Sensor } from './types';

export function createSensors(now: number): Sensor[] {
  return [
    {
      id: 'sen-sbb', label: 'Southbank Blvd drain', location: SEGMENT_MIDPOINTS['seg-sbb'],
      waterLevelCm: 46, thresholdCm: 30, status: 'triggered', updatedAt: minutesAgo(1, now), segmentId: 'seg-sbb',
    },
    {
      id: 'sen-elizabeth', label: 'Elizabeth St culvert', location: SEGMENT_MIDPOINTS['seg-elizabeth'],
      waterLevelCm: 41, thresholdCm: 35, status: 'triggered', updatedAt: minutesAgo(2, now), segmentId: 'seg-elizabeth',
    },
    {
      id: 'sen-cityrd', label: 'City Rd stormwater pit', location: SEGMENT_MIDPOINTS['seg-cityrd'],
      waterLevelCm: 24, thresholdCm: 35, status: 'normal', updatedAt: minutesAgo(1, now), segmentId: 'seg-cityrd',
    },
    {
      id: 'sen-yarra', label: 'Yarra River gauge, Princes Bridge', location: [-37.81945, 144.96852],
      waterLevelCm: 142, thresholdCm: 180, status: 'normal', updatedAt: minutesAgo(3, now), segmentId: 'seg-stkr',
    },
  ];
}
