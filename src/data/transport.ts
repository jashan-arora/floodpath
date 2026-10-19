import { TRANSPORT_GEOMETRY } from './geo.generated';
import { minutesAgo } from './time';
import type { TramDisruption } from './types';

export function createTransport(now: number): TramDisruption[] {
  const base = (id: string) => ({ geometry: TRANSPORT_GEOMETRY[id], active: true });
  return [
    {
      ...base('td-route1'), id: 'td-route1', kind: 'tram', route: 'Route 1', status: 'suspended',
      operator: 'Yarra Trams', verified: true, updatedAt: minutesAgo(8, now),
      stopsAffected: ['Sturt St/Grant St', 'Southbank Blvd/Sturt St', 'Arts Centre'],
      message: 'Suspended between Kings Way and St Kilda Rd. Southbank Blvd tracks are under water.',
    },
    {
      ...base('td-arts'), id: 'td-arts', kind: 'tram', route: 'Routes 3, 5, 6', status: 'not_stopping',
      operator: 'Yarra Trams', verified: true, updatedAt: minutesAgo(25, now),
      stopsAffected: ['Arts Precinct'],
      message: 'Not stopping at Arts Precinct while the platform is cleared. Routes 16, 64 and 72 are running.',
    },
    {
      ...base('td-elizabeth'), id: 'td-elizabeth', kind: 'tram', route: 'Routes 19, 57, 59', status: 'suspended',
      operator: 'Yarra Trams', verified: true, updatedAt: minutesAgo(12, now),
      stopsAffected: ['Flinders St/Elizabeth St', 'Collins St/Elizabeth St', 'Bourke St Mall'],
      message: 'Suspended on Elizabeth St because of flash flooding. Use Swanston St trams.',
    },
    {
      ...base('bus-605'), id: 'bus-605', kind: 'bus', route: 'Bus 605', status: 'cancelled',
      operator: 'Transport Victoria', verified: false, updatedAt: minutesAgo(16, now),
      stopsAffected: ['City Rd/Southbank Blvd'],
      message: 'Possible cancellation while City Rd is assessed.',
    },
    {
      ...base('bus-234'), id: 'bus-234', kind: 'bus', route: 'Bus 234 and 236', status: 'diverted',
      operator: 'Transport Victoria', verified: true, updatedAt: minutesAgo(30, now),
      stopsAffected: ['City Rd/Queens Bridge St'],
      message: 'Diverted via Kings Way. Stops on City Rd are not served.',
    },
  ];
}
