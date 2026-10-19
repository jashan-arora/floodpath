import type { PointOfInterest } from './types';

// Names follow the Figma services frames where possible. Details are illustrative.
export const POIS: PointOfInterest[] = [
  { id: 'poi-shelter-power', type: 'shelter', name: 'Power St relief centre', location: [-37.82418, 144.96205], detail: 'Open 24 hours. Beds for 120, dry clothing and hot meals.' },
  { id: 'poi-shelter-msq', type: 'shelter', name: 'Melbourne Square community room', location: [-37.82628, 144.96132], detail: 'Open until 10 pm. Seating for 60, pets welcome.' },
  { id: 'poi-shelter-linear', type: 'shelter', name: 'Linear Park pavilion', location: [-37.82905, 144.96455], detail: 'Day shelter from 7 am. Water and phone charging.' },
  { id: 'poi-med-clinic', type: 'medical', name: 'Southbank Medical Clinic', location: [-37.82488, 144.96496], detail: 'GP clinic open until 8 pm. Walk-ins for flood injuries.' },
  { id: 'poi-med-redcross', type: 'medical', name: 'Red Cross first aid post', location: [-37.82236, 144.97085], detail: 'Arts Precinct forecourt. First aid and welfare checks.' },
  { id: 'poi-med-rmh', type: 'medical', name: 'Royal Melbourne Hospital', location: [-37.79925, 144.95680], detail: 'Emergency department open 24 hours. Shown for illustration.' },
  { id: 'poi-power-boyd', type: 'power', name: 'Boyd Community Hub charging', location: [-37.82700, 144.95985], detail: 'Backup power. Phone and medical-device charging.' },
  { id: 'poi-power-arts', type: 'power', name: 'Arts Centre charging point', location: [-37.82118, 144.96905], detail: 'Generator-backed charging, 8 am to 8 pm.' },
  { id: 'poi-water-msq', type: 'water', name: 'Woolworths Melbourne Square', location: [-37.82660, 144.96180], detail: 'Bottled water handouts from the loading dock.' },
  { id: 'poi-water-acca', type: 'water', name: 'ACCA water station', location: [-37.82672, 144.96718], detail: 'Drinking water refill station.' },
  { id: 'poi-crew-sbb', type: 'repair_crew', name: 'Pump crew, Southbank Blvd', location: [-37.82395, 144.96690], detail: 'City of Melbourne crew pumping the drain. Expected to clear in 2 hours.' },
  { id: 'poi-crew-eliz', type: 'repair_crew', name: 'Drainage crew, Elizabeth St', location: [-37.81668, 144.96392], detail: 'Clearing the culvert at Collins St.' },
];
