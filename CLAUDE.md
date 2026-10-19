# FloodPath: project context for Claude Code

> Read this file before converting the Figma prototype. The Figma file is the source of truth for **visuals and layout**. This file is the source of truth for **behaviour, data, and intent**. Where they conflict on look and feel, follow Figma. Where they conflict on behaviour, follow this file and flag the conflict.

## 1. What we're building

**FloodPath** is a mobile-first web app that shows a **live map of flood-affected areas** and helps people **navigate using alternative routes** that avoid flooded or closed streets.

This is a **demo-only, frontend-only React app**. There is **no backend**. All data (flood zones, reports, sensors, routes, alerts) is mock data held in the client. It must feel fully functional and live during a presentation, even though everything is simulated.

- Audience: demo presentation (assessors, stakeholders)
- Setting: **Melbourne, Australia**, centred on the **Southbank / CBD** area, with the **City of Melbourne** as the council body
- Users: residents, commuters, and pedestrians during and after a flood event

## 2. Problem and design rationale

Origin: a design-thinking workshop on helping residents during and after floods. The idea sits in the "innovative + easy to implement" zone of our idea matrix.

Ideas this app delivers on:
- Live map showing flooded or closed streets, pedestrian access, tram disruptions, medical services
- Water level sensors that alert the council and feed resident-facing data
- Resident live photo-reporting, with incentives for residents to report
- Essential-info layers: shelters, backup power or charging points, medical services, emergency repair team locations

**Differentiation from Google Maps and Waze:** they already offer broad flood overlays, crowdsourced road reports, and crisis rerouting. FloodPath's value is **local depth and civic integration**: council-level data (tram disruptions, shelters, repair crews), denser hyperlocal coverage, and incentivised reporting. Keep this framing in any in-app copy or demo narrative.

## 3. Screens and flows

> Frame names below are placeholders. Match them to the actual Figma frame names and note any differences in section 11.

### 3.1 Live map (home)
- Full-bleed map with a top bar (app name, notifications bell)
- Flood overlay in three severity states:
  - **Flooded / impassable**: red
  - **Caution / partial**: amber
  - **Clear**: default or green
- Legend chip (Flooded, Caution, Shelter)
- Bottom sheet with a **"Where to?"** search field and an **alert banner** when the user's current or planned route hits a closure (e.g. "Southbank Rd closed" with a **Reroute** action)
- Tapping a flood segment or marker opens a detail card (severity, source, last updated, photo if any)

### 3.2 Search and route navigation
- User enters a destination (autocomplete from a small mock list of places)
- App shows **two route options**: the original route (with the blocked segment highlighted) and an **alternative route** that avoids flooded areas
- Route card shows ETA, distance, and what was avoided (e.g. "Avoids 2 flooded streets")
- Mode selector: **Walk / Drive / Transit**. Results differ per mode (e.g. tram disruptions only affect Transit; pedestrian-closed paths only affect Walk)
- "Start" begins a simulated navigation view: a marker moves along the polyline with a step-by-step instruction banner

### 3.3 Live re-route (key demo moment)
- During navigation, a new closure appears on the route (triggered by the demo control panel, see section 8)
- A banner interrupts: "New flooding ahead on [street]. Reroute?"
- Accepting swaps to a new pre-defined alternative polyline and updates ETA

### 3.4 Resident report flow
- Screen title "Report flooding" with a back button
- Fields: **photo** (upload or camera placeholder), **location** (prefilled with a mock current location, editable), **severity** (Caution / Impassable)
- Reward hint: "+10 points", and an impact line such as "Helps 200+ nearby"
- **Submit report** adds the report to local state, appears on the map as a pending marker, and moves to "verified" after a short simulated delay (or once a second report or sensor confirms)
- Points total updates and is shown in a profile or rewards indicator

### 3.4b Alerts feed
- List of notifications: saved route disrupted, home or work address near rising water, sensor-triggered alerts, council updates
- Each alert shows severity, time, and a CTA (View on map, Reroute)

### 3.5 Layers panel
Toggles for overlays on the map:
- Flood zones
- Shelters
- Medical services
- Charging or backup power points
- Repair crew locations
- Tram disruptions
- Water level sensors

## 4. Mock data model (TypeScript)

All data lives in `src/data/` as typed constants. Use these shapes.

```ts
type Severity = 'clear' | 'caution' | 'flooded';
type TravelMode = 'walk' | 'drive' | 'transit';
type ReportStatus = 'pending' | 'verified';
type LatLng = [number, number]; // [lat, lng]

interface FloodSegment {
  id: string;
  streetName: string;
  severity: Severity;
  geometry: LatLng[];            // polyline
  source: 'sensor' | 'resident' | 'council';
  updatedAt: string;             // ISO
  affectsModes: TravelMode[];
}

interface ResidentReport {
  id: string;
  location: LatLng;
  streetName: string;
  severity: Exclude<Severity, 'clear'>;
  photoUrl?: string;
  status: ReportStatus;
  createdAt: string;
  reporterName: string;
}

interface Sensor {
  id: string;
  location: LatLng;
  label: string;
  waterLevelCm: number;
  thresholdCm: number;           // above = alert council
  status: 'normal' | 'triggered';
}

interface PointOfInterest {
  id: string;
  type: 'shelter' | 'medical' | 'power' | 'repair_crew';
  name: string;
  location: LatLng;
  detail?: string;               // opening hours, capacity, etc.
}

interface TramDisruption {
  id: string;
  route: string;                 // e.g. "Route 96"
  stopsAffected: string[];
  message: string;
  geometry: LatLng[];
}

interface RouteOption {
  id: string;
  mode: TravelMode;
  label: 'Original' | 'Alternative';
  geometry: LatLng[];
  etaMinutes: number;
  distanceKm: number;
  avoidsSegmentIds: string[];
  blockedSegmentIds: string[];   // non-empty = route is compromised
  steps: { instruction: string; at: LatLng }[];
}

interface AppAlert {
  id: string;
  type: 'route_disrupted' | 'home_risk' | 'sensor' | 'council';
  title: string;
  body: string;
  severity: Severity;
  createdAt: string;
  read: boolean;
}

interface UserProfile {
  name: string;
  points: number;
  homeAddress: string;
  workAddress: string;
  savedRoutes: string[];
}
```

### Mock data guidance
- Use **real Melbourne place names**: Southbank Blvd, Southbank Promenade, Flinders St Station, Queen Victoria Market, Federation Square, Yarra River, Crown Casino area, Melbourne Arts Precinct, Royal Melbourne Hospital (illustrative only)
- Coordinates should be **approximate and plausible**; exact accuracy is not required
- Seed **8 to 12 flood segments**, **4 to 6 resident reports**, **4 sensors** (1 or 2 triggered), **3 shelters**, **3 medical services**, **2 power points**, **2 repair crews**, **2 tram disruptions**
- Seed **3 demo journeys** (see section 7)
- Timestamps relative to "now" (e.g. "5 min ago", "22 min ago") so data looks live. Generate them at load time rather than hardcoding dates.

## 5. Behaviour rules (simulation logic)

- **State**: use a single store (Zustand or React Context + reducer) for flood segments, reports, alerts, active route, layer toggles, and user points. Persist nothing; a refresh resets to the seeded demo state.
- **Routing is mocked.** Do **not** integrate a real routing API. Each demo journey has pre-authored `RouteOption`s. Route selection logic: if any `blockedSegmentIds` on the original route are currently `flooded`, mark it compromised and recommend the alternative. This makes toggling flood state in the demo change the outcome realistically.
- **Mode filtering**: only treat a segment as blocking if its `affectsModes` includes the selected mode.
- **Report verification**: a new report starts `pending`, then flips to `verified` after ~4 seconds, and awards points (+10). A verified report may escalate the matching flood segment's severity.
- **Sensor alerts**: if a sensor's `waterLevelCm` exceeds `thresholdCm`, show it as triggered and (in the demo) generate a council-facing alert plus a resident alert.
- **Live feel**: small simulated updates every 20 to 40 seconds are fine (an "updated just now" timestamp, a sensor reading nudging). Keep them subtle and deterministic enough that the demo doesn't surprise the presenter. Provide a toggle to disable them.
- **Simulated navigation**: animate a marker along the route polyline at an accelerated speed. No real geolocation required; use a fixed mock "current location".

## 6. Visual design notes

Figma is authoritative. These are the intended principles and fallback values if something isn't specified.

- Clean, flat, calm UI. Mobile-first (design width about 375 to 390px). The desktop view can show the phone layout centred, or a simple responsive adaptation.
- Severity colours (use consistently on map, chips, and alerts):
  - Flooded: red `#E24B4A` (text on tint `#A32D2D`)
  - Caution: amber `#EF9F27` (text on tint `#854F0B`)
  - Shelter, safe, success: teal or green `#0F6E56`
  - Accent and links: blue `#185FA5`
- Never rely on colour alone. Pair with icons and labels (accessibility).
- Sentence case for all copy. Short, plain, calm tone. No exclamation marks on system copy. Verb-first buttons ("Submit report", "Reroute", "Start navigation").
- Extract exact colours, spacing, type, radii, and icons from Figma variables and styles. If Figma defines design tokens, convert them to CSS variables or the Tailwind config rather than hardcoding values.

## 7. Demo script (the app must support this path end to end)

1. **Open app**: map shows flood overlay around Southbank. Alerts bell shows 2 unread.
2. **Search "Flinders St Station"** from the mock current location. The original route is flagged as blocked at Southbank Blvd, with an alternative suggested.
3. **Compare modes**: switch Walk, Drive, Transit. Show that the result changes (e.g. a tram disruption affects Transit).
4. **Start navigation**: marker moves along the alternative route.
5. **Live re-route**: the presenter triggers a new closure via the demo panel. The banner appears and the user accepts the reroute, with ETA updated.
6. **Report flooding**: submit a report with a photo. It appears as pending, becomes verified, and +10 points are awarded.
7. **Layers**: toggle shelters, medical, power, and sensors to show the civic data layer.
8. **Alerts feed**: show a sensor-triggered alert and a "saved route disrupted" alert.

## 8. Hidden demo control panel

Add a small, unobtrusive **demo panel** (toggle with a keyboard shortcut such as `Shift+D`, or a tiny corner icon) so the presenter can drive the simulation:
- Trigger "new flooding on [street]" (updates the map, fires an alert, and can trigger the live re-route)
- Trigger "sensor threshold exceeded"
- Clear all flooding (reset to clean state)
- Reset the demo to its initial state
- Toggle auto-simulated updates on or off

## 9. Technical requirements

- **Stack**: Vite + React + TypeScript. Tailwind CSS is fine if it matches how the Figma output is structured. Use React Router for screens (or a simple tab and sheet state if that fits the prototype better).
- **Map**: use **MapLibre GL JS** or **Leaflet** with free OpenStreetMap-based tiles, so **no API keys are needed**. Render flood segments as coloured polylines and POIs as markers. Do not use Google Maps (it needs a key and billing).
- **State**: Zustand (preferred) or Context + reducer.
- **No backend, no network calls** for app data. Images for reports can be local object URLs or bundled sample images.
- **Icons**: use what Figma uses; if it's a standard set, use the matching package (e.g. Tabler Icons, Lucide).
- Keep components small and organised by feature. Suggested structure:

```
src/
  components/      # shared UI (Button, Chip, BottomSheet, AlertBanner, Legend)
  features/
    map/           # MapView, FloodLayer, MarkerLayer, LayerPanel
    navigation/    # SearchBar, RouteCard, NavigationView, ModeSelector
    report/        # ReportForm, PhotoPicker
    alerts/        # AlertsFeed, AlertItem
    demo/          # DemoPanel
  data/            # typed mock data (segments, reports, sensors, pois, routes, alerts)
  store/           # global state + simulation actions
  styles/          # tokens, globals
```

- Must run with `npm install && npm run dev`, with no env vars or external services.
- Must work well on a mobile viewport and look good when projected on a laptop or large screen.

## 10. Instructions for converting the Figma prototype

1. **Read the Figma file structure first**: list pages, frames, components, and variants before writing code. Map each frame to a screen or component using section 3.
2. **Extract design tokens** (colours, typography, spacing, radii, shadows) from Figma into CSS variables or the Tailwind theme before building components.
3. **Build reusable components** from Figma components (buttons, chips, cards, bottom sheet, alert banner, severity badge) first, then compose screens.
4. **Follow Figma's prototype flows** (the connections between frames) for navigation and transitions, then wire real state per sections 4 and 5.
5. **Replace static placeholders with dynamic data**: anything in Figma that looks like sample content (street names, times, points, counts) should be driven by the mock data store.
6. **Don't over-build**: no auth, no settings screens, no real geolocation, no real routing. If a Figma frame is outside section 3, build it as a simple static screen and list it in your summary.
7. **Make every visible control do something** (even if simulated). Dead buttons are a demo risk.
8. **After building**, run the app, walk through the demo script in section 7, fix anything that breaks, and summarise what was built, what was mocked, and any deviations from Figma.

## 11. Figma-specific notes (fill in before running)

- Figma file URL: http://figma.com/design/6Ncu6Fnakz9ghlmwu6BFBw/UI-Wireframe (treated as a visual reference only; requirements here drive layout)
- Main frames or pages: one page, 25 frames at 402×874: `Homepage`, `Live Map` (+ Flooding / Road / Road-info / Transport / Transport-info / Services / Flood Details variants), `Reporting Page 1`, `Reporting Page 2`; components `NavBar`, `Flood/Transport/Road/Service Select` (Default/Selected)
- Screens in Figma not covered above: `Homepage` ("Southbank Recovery Hub") → built as the Hub tab with static Emergency services and Further information screens; Forum tab → replaced by Alerts; Settings gear → dropped
- Interactions that differ: Figma's map sits in a card with filter chips → built as a full-bleed map with the chips as quick filters plus a 7-layer panel; report form uses Figma's structured options plus severity, +10 points and "Helps 200+ nearby"; Verified badge is teal (Figma used amber for both states); Figma's cyan "partial flooding" line is amber per section 6
- Data-model extensions: `TramDisruption.kind/status/operator/verified/active` (buses from Figma), POI type `water`, `RouteOption.disruptionIds/note`, `FloodSegment.note/confirmed`, `Sensor.segmentId`
- Laptop layout: navigation rail + side panel + full-height map (no phone frame). Phones: full-screen map, bottom sheet, tab bar; installable via the web app manifest

## 12. Out of scope

Backend or API, authentication, real GPS, real routing, push notifications (simulate with in-app banners only), multi-language support, accessibility audit beyond basic contrast, labels, and keyboard focus, and real council or sensor integrations.
