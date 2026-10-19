# FloodPath

**Live:** https://jashan-arora.github.io/floodpath/

Live flood map and safer routes for Southbank, Melbourne. Frontend-only: every flood segment, report, sensor, route and alert is mock data generated in the browser, so there is no backend and no API key.

- **Phones**: full-screen map with a bottom sheet and tab bar. Installable from the browser ("Add to Home Screen") and opens like a native app.
- **Laptops**: navigation rail, side panel and a full-height map.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build` (type-check and production build to `dist/`), `npm run preview` (serve the build on port 4173), `npm run lint`.

## Deploy

**GitHub Pages (current)**: every push to `main` runs `.github/workflows/deploy.yml`, which builds with `BASE_PATH=/<repo>/` (the site lives under `/floodpath/`), copies `index.html` to `404.html` so deep links like `/floodpath/route/j-fss` load, and publishes `dist/`. Check runs with `gh run list` or the repo's Actions tab.

`npm run build` produces a static site in `dist/`, so other static hosts work too. Client-side routes need an SPA fallback to `index.html`, which is already configured for:

- **Vercel**: `npx vercel` from the repo root (`vercel.json` holds the rewrite).
- **Netlify**: `npx netlify deploy --prod --dir=dist`, or drag `dist/` onto app.netlify.com/drop (`public/_redirects` holds the rewrite).

To show it on a phone, open the deployed URL and use **Share → Add to Home Screen** (iOS) or **Install app** (Android Chrome).

The basemap uses OpenStreetMap tiles, so the map background needs internet. Flood lines, markers and routes are local and still draw if tiles fail.

## Presenting

Press **Shift+D** (or tap the faint dot in the top-left corner on a phone) for the hidden demo panel:

| Control | What it does |
|---|---|
| New flooding on [street] | Floods a street. During navigation it suggests the street ahead on your route, which triggers the live reroute. |
| Sensor threshold exceeded | Pushes a water-level sensor over its threshold, closes its street and sends a council alert and a resident alert. |
| Clear flooding / Reset demo | Reopens every street, or restores the starting data. A page refresh also resets. |
| Pause navigation | Freezes the moving marker so you can talk. |
| Auto updates | Turns the 30-second "live" sensor and timestamp updates on or off. |

### Demo script (CLAUDE.md section 7)

1. Open the app. The map shows flooding around Southbank and Alerts shows 2 unread.
2. **Where to?** → "Flinders St Station". The original route is blocked at Southbank Blvd and the alternative is recommended.
3. Switch Walk / Drive / Transit. Transit shows Route 1 suspended and Routes 3, 5 and 6 not stopping.
4. **Start navigation**. The marker moves along Grant St and St Kilda Rd.
5. Shift+D → **Flood it** (St Kilda Rd is pre-selected) → **Reroute**. The route switches to Dodds St and the ETA updates. Trigger it within about 30 seconds of starting, before the marker reaches St Kilda Rd, or pause navigation first.
6. **Report** → add a photo (or "Use a sample photo"), choose what's happening and how bad it is → **Submit report**. It shows as checking, verifies after about 4 seconds and adds 10 points.
7. **Layers** → turn on shelters, medical, charging and sensors.
8. Shift+D → **Trigger** a sensor, then open **Alerts**.

## How it's built

Vite, React 19, TypeScript, Tailwind CSS 4, Zustand, React Router, Leaflet with react-leaflet.

```
src/
  components/   shared UI (buttons, badges, sheet/panel, tab bar, rail, toasts)
  features/     map, navigation, report, alerts, hub, profile, demo
  data/         typed mock data; geo.generated.ts holds routes and flood lines
  store/        Zustand store, route evaluation, navigation and simulation
  styles/       design tokens (Tailwind @theme) and global CSS
scripts/
  build-geo.py  regenerates routes from the OpenStreetMap extract in scripts/osm/
  playwright/   demo walkthrough and dead-control audit used for verification
```

Routes are pre-authored but follow real streets: `scripts/build-geo.py` routes along an OpenStreetMap extract and writes `src/data/geo.generated.ts`. You only need Python to change routes, not to run the app.

Map data © OpenStreetMap contributors (ODbL).
