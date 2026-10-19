import { SEGMENT_GEOMETRY } from './geo.generated';
import { minutesAgo } from './time';
import type { FloodSegment } from './types';

type Seed = Omit<FloodSegment, 'geometry' | 'updatedAt'> & { minutesAgo: number };

const SEEDS: Seed[] = [
  {
    id: 'seg-sbb', streetName: 'Southbank Blvd', severity: 'flooded', source: 'sensor', minutesAgo: 6,
    affectsModes: ['walk', 'drive', 'transit'], confirmed: true,
    note: 'Water over the road between Sturt St and Dodds St. The drain sensor is above its threshold.',
  },
  {
    id: 'seg-stkr', streetName: 'St Kilda Rd', severity: 'clear', source: 'council', minutesAgo: 18,
    affectsModes: ['walk', 'drive', 'transit'], confirmed: true,
    note: 'Open to traffic past the Arts Centre. Conditions may change.',
  },
  {
    id: 'seg-dodds', streetName: 'Dodds St', severity: 'caution', source: 'resident', minutesAgo: 11,
    affectsModes: ['walk', 'drive', 'transit'], confirmed: false,
    note: 'Water across part of the road near ACCA. Passable with care.',
  },
  {
    id: 'seg-elizabeth', streetName: 'Elizabeth St', severity: 'flooded', source: 'sensor', minutesAgo: 9,
    affectsModes: ['walk', 'drive', 'transit'], confirmed: true,
    note: 'Flash flooding between Flinders St and Bourke St. Trams are suspended.',
  },
  {
    id: 'seg-cityrd', streetName: 'City Rd', severity: 'caution', source: 'resident', minutesAgo: 22,
    affectsModes: ['walk', 'drive'], confirmed: false,
    note: 'Water reported on the roadway. Extent has not been confirmed.',
  },
  {
    id: 'seg-promenade', streetName: 'Southbank Promenade', severity: 'flooded', source: 'resident', minutesAgo: 9,
    affectsModes: ['walk'], confirmed: true,
    note: 'Riverside path under water near Southgate. Closed to pedestrians and cyclists.',
  },
  {
    id: 'seg-sturt-south', streetName: 'Sturt St', severity: 'clear', source: 'council', minutesAgo: 5,
    affectsModes: ['walk', 'drive', 'transit'], confirmed: true,
    note: 'Road reported open with no visible flooding. Conditions may change.',
  },
  {
    id: 'seg-kingsway', streetName: 'Kings Way', severity: 'caution', source: 'sensor', minutesAgo: 27,
    affectsModes: ['drive'], confirmed: true,
    note: 'Water pooling in the underpass lanes. Drive slowly and keep left.',
  },
  {
    id: 'seg-flinders', streetName: 'Flinders St', severity: 'caution', source: 'council', minutesAgo: 35,
    affectsModes: ['walk', 'drive'], confirmed: true,
    note: 'Kerbside flooding between Queen St and William St.',
  },
  {
    id: 'seg-power', streetName: 'Power St', severity: 'clear', source: 'council', minutesAgo: 40,
    affectsModes: ['walk', 'drive'], confirmed: true,
    note: 'Open. Access to the relief centre is clear.',
  },
  {
    id: 'seg-alexandra', streetName: 'Alexandra Ave', severity: 'flooded', source: 'council', minutesAgo: 52,
    affectsModes: ['walk', 'drive'], confirmed: true,
    note: 'Closed along the river. The Yarra is over its banks here.',
  },
];

export function createSegments(now: number): FloodSegment[] {
  return SEEDS.map(({ minutesAgo: m, ...s }) => ({
    ...s,
    geometry: SEGMENT_GEOMETRY[s.id],
    updatedAt: minutesAgo(m, now),
  }));
}
