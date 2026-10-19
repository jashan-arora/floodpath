import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router';
import { PanelSlotContext } from './components/Panel';
import { Rail } from './components/Rail';
import { TabBar } from './components/TabBar';
import { Toaster } from './components/Toaster';
import { AlertsScreen } from './features/alerts/AlertsScreen';
import { DemoCornerButton, DemoPanel, useDemoHotkey } from './features/demo/DemoPanel';
import { EmergencyScreen } from './features/hub/EmergencyScreen';
import { HubScreen } from './features/hub/HubScreen';
import { InfoScreen } from './features/hub/InfoScreen';
import { DesktopMapControls } from './features/map/MapControls';
import type { MapMode } from './features/map/MapController';
import { MapHome } from './features/map/MapHome';
import { MapView } from './features/map/MapView';
import { NavigationScreen } from './features/navigation/NavigationScreen';
import { RoutePlanner } from './features/navigation/RoutePlanner';
import { SearchScreen } from './features/navigation/SearchScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { ReportScreen } from './features/report/ReportScreen';
import { useIsDesktop } from './lib/useMediaQuery';
import { useSimulation } from './store/simulation';
import { useAppStore } from './store/useAppStore';

/** Screens that take over the whole phone hide the tab bar. */
const FULL_SCREEN = /^\/(search|route|navigate)/;

function mapModeFor(pathname: string): MapMode {
  if (pathname.startsWith('/route')) return 'plan';
  if (pathname.startsWith('/navigate')) return 'nav';
  return 'home';
}

/** On laptops the map stays visible beside every page; picking something on it opens its details. */
function useMapSelectionOpensDetails(desktop: boolean, pathname: string) {
  const selected = useAppStore((s) => s.selected);
  const navigate = useNavigate();
  useEffect(() => {
    if (desktop && selected && pathname !== '/' && mapModeFor(pathname) === 'home') navigate('/');
    // only react to new selections, not to route changes
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Phones: full-screen map with sheets and the tab bar.
 * Laptops: navigation rail, side panel and a full-height map.
 * One Leaflet map stays mounted throughout.
 */
function AppShell() {
  const { pathname } = useLocation();
  const desktop = useIsDesktop();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const mode = mapModeFor(pathname);
  useSimulation();
  useDemoHotkey();
  useMapSelectionOpensDetails(desktop, pathname);

  return (
    <PanelSlotContext.Provider value={desktop ? slot : null}>
      <div className="flex h-dvh w-full overflow-hidden bg-page">
        {desktop && <Rail />}
        {desktop && (
          <aside
            ref={setSlot}
            aria-label="Side panel"
            className="relative z-10 flex w-[400px] shrink-0 flex-col overflow-y-auto border-r border-line bg-page shadow-[6px_0_24px_rgb(24_59_86/0.07)]"
          />
        )}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <main className="relative min-h-0 flex-1 overflow-hidden bg-[#e9eef2]">
            {/* On phones a full page covers the map; keep its markers out of the tab order. */}
            <div className="absolute inset-0" inert={!desktop && !FULL_SCREEN.test(pathname) && pathname !== '/'}>
              <MapView mode={mode} />
            </div>
            {desktop && mode === 'home' && <DesktopMapControls />}
            <Outlet />
            <Toaster />
          </main>
          {!desktop && !FULL_SCREEN.test(pathname) && <TabBar />}
          <DemoCornerButton />
        </div>
        <DemoPanel />
      </div>
    </PanelSlotContext.Provider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<MapHome />} />
        <Route path="search" element={<SearchScreen />} />
        <Route path="route/:journeyId" element={<RoutePlanner />} />
        <Route path="navigate" element={<NavigationScreen />} />
        <Route path="hub" element={<HubScreen />} />
        <Route path="hub/emergency" element={<EmergencyScreen />} />
        <Route path="hub/info" element={<InfoScreen />} />
        <Route path="report" element={<ReportScreen />} />
        <Route path="alerts" element={<AlertsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
