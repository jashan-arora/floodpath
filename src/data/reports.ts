import promenadePhoto from '../assets/reports/promenade.svg';
import kerbPhoto from '../assets/reports/kerb.svg';
import streetPhoto from '../assets/reports/street.svg';
import { minutesAgo } from './time';
import type { ResidentReport } from './types';

export const SAMPLE_PHOTO = streetPhoto;

export function createReports(now: number): ResidentReport[] {
  return [
    {
      id: 'rep-1', location: [-37.82322, 144.96334], streetName: 'City Rd', severity: 'caution',
      status: 'verified', createdAt: minutesAgo(22, now), reporterName: 'Mia T.', kind: 'flooded_road',
      photoUrl: kerbPhoto, segmentId: 'seg-cityrd',
      note: 'Kerb lanes under water outside the apartments. Cars are slowing down.',
    },
    {
      id: 'rep-2', location: [-37.81996, 144.96612], streetName: 'Southbank Promenade', severity: 'flooded',
      status: 'verified', createdAt: minutesAgo(9, now), reporterName: 'Jordan K.', kind: 'blocked_footpath',
      photoUrl: promenadePhoto, segmentId: 'seg-promenade',
      note: 'The river is over the path near Southgate. No way through on foot.',
    },
    {
      id: 'rep-3', location: [-37.82352, 144.96765], streetName: 'Southbank Blvd', severity: 'flooded',
      status: 'verified', createdAt: minutesAgo(14, now), reporterName: 'Priya S.', kind: 'flooded_road',
      photoUrl: streetPhoto, segmentId: 'seg-sbb',
      note: 'Water over the tram tracks outside the Recital Centre.',
    },
    {
      id: 'rep-4', location: [-37.82502, 144.96826], streetName: 'Dodds St', severity: 'caution',
      status: 'pending', createdAt: minutesAgo(3, now), reporterName: 'Alex W.', kind: 'flooded_road',
      segmentId: 'seg-dodds',
      note: 'Large puddle across the northbound lane near ACCA.',
    },
    {
      id: 'rep-5', location: [-37.81705, 144.96443], streetName: 'Elizabeth St', severity: 'flooded',
      status: 'verified', createdAt: minutesAgo(31, now), reporterName: 'Sam L.', kind: 'flooded_road',
      segmentId: 'seg-elizabeth',
      note: 'Knee-deep at the Collins St corner. Trams have stopped.',
    },
  ];
}
