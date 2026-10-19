import { minutesAgo } from './time';
import type { AppAlert } from './types';

export function createAlerts(now: number): AppAlert[] {
  return [
    {
      id: 'al-route', type: 'route_disrupted', severity: 'flooded', read: false, createdAt: minutesAgo(6, now),
      title: 'Your route to work is disrupted',
      body: 'Southbank Blvd is flooded between Sturt St and Dodds St. A route via Grant St and St Kilda Rd is clear.',
      journeyId: 'j-fss', target: { kind: 'segment', id: 'seg-sbb' },
    },
    {
      id: 'al-sensor', type: 'sensor', severity: 'flooded', read: false, createdAt: minutesAgo(12, now),
      title: 'Water level sensor triggered',
      body: 'The Southbank Blvd drain reads 46 cm, above its 30 cm threshold. City of Melbourne crews have been notified.',
      target: { kind: 'sensor', id: 'sen-sbb' },
    },
    {
      id: 'al-home', type: 'home_risk', severity: 'caution', read: true, createdAt: minutesAgo(28, now),
      title: 'Water rising near home',
      body: 'Dodds St, one block from your home, has water across part of the road. Avoid the underpass on Kings Way.',
      target: { kind: 'segment', id: 'seg-dodds' },
    },
    {
      id: 'al-trams', type: 'council', severity: 'caution', read: true, createdAt: minutesAgo(25, now),
      title: 'Trams not stopping at Arts Precinct',
      body: 'Routes 3, 5 and 6 are skipping the stop. Routes 16, 64 and 72 are running.',
      target: { kind: 'transport', id: 'td-arts' },
    },
    {
      id: 'al-shelter', type: 'council', severity: 'clear', read: true, createdAt: minutesAgo(64, now),
      title: 'Relief centre open on Power St',
      body: 'Beds, dry clothing, hot meals and phone charging are available around the clock.',
      target: { kind: 'poi', id: 'poi-shelter-power' },
    },
  ];
}
