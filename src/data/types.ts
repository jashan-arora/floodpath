// Shapes follow CLAUDE.md section 4. Fields marked "extension" are additions
// needed for the Figma content (buses, water points) or for the demo UI.

export type Severity = 'clear' | 'caution' | 'flooded';
export type TravelMode = 'walk' | 'drive' | 'transit';
export type ReportStatus = 'pending' | 'verified';
export type LatLng = [number, number]; // [lat, lng]

export interface FloodSegment {
  id: string;
  streetName: string;
  severity: Severity;
  geometry: LatLng[];
  source: 'sensor' | 'resident' | 'council';
  updatedAt: string;
  affectsModes: TravelMode[];
  /** extension: short plain-language description for the detail card */
  note: string;
  /** extension: confirmed by council, a sensor or a second report */
  confirmed: boolean;
}

/** extension: what the resident saw, from the report form */
export type ReportKind = 'flooded_road' | 'blocked_footpath' | 'power_outage' | 'debris';

export interface ResidentReport {
  id: string;
  location: LatLng;
  streetName: string;
  severity: Exclude<Severity, 'clear'>;
  photoUrl?: string;
  status: ReportStatus;
  createdAt: string;
  reporterName: string;
  /** extensions */
  kind: ReportKind;
  note?: string;
  segmentId?: string;
}

export interface Sensor {
  id: string;
  location: LatLng;
  label: string;
  waterLevelCm: number;
  thresholdCm: number;
  status: 'normal' | 'triggered';
  /** extensions */
  updatedAt: string;
  segmentId?: string;
}

export interface PointOfInterest {
  id: string;
  /** extension: 'water' added for Figma's water-supply points */
  type: 'shelter' | 'medical' | 'power' | 'water' | 'repair_crew';
  name: string;
  location: LatLng;
  detail?: string;
}

export interface TramDisruption {
  id: string;
  route: string;
  stopsAffected: string[];
  message: string;
  geometry: LatLng[];
  /** extensions: Figma also shows bus disruptions */
  kind: 'tram' | 'bus';
  status: 'suspended' | 'cancelled' | 'diverted' | 'not_stopping';
  operator: string;
  verified: boolean;
  active: boolean;
  updatedAt: string;
}

export interface RouteOption {
  id: string;
  mode: TravelMode;
  label: 'Original' | 'Alternative';
  geometry: LatLng[];
  etaMinutes: number;
  distanceKm: number;
  avoidsSegmentIds: string[];
  blockedSegmentIds: string[];
  steps: { instruction: string; at: LatLng }[];
  /** extensions: transit disruptions this route depends on, and a rider note */
  disruptionIds?: string[];
  note?: string;
}

export type FeatureKind = 'segment' | 'report' | 'sensor' | 'poi' | 'transport';
export interface FeatureRef {
  kind: FeatureKind;
  id: string;
}

export interface AppAlert {
  id: string;
  type: 'route_disrupted' | 'home_risk' | 'sensor' | 'council';
  title: string;
  body: string;
  severity: Severity;
  createdAt: string;
  read: boolean;
  /** extensions: what the alert's buttons open */
  target?: FeatureRef;
  journeyId?: string;
}

export interface UserProfile {
  name: string;
  points: number;
  homeAddress: string;
  workAddress: string;
  savedRoutes: string[]; // journey ids
}

/** extension: a destination with its pre-authored routes */
export interface Journey {
  id: string;
  destination: string;
  area: string;
  location: LatLng;
  keywords: string[];
  routes: RouteOption[];
}
