import '@fontsource-variable/inter';
import '@fontsource-variable/lexend';
import 'leaflet/dist/leaflet.css';
import './styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { useAppStore } from './store/useAppStore';

// Dev only: lets the Playwright checks inspect simulation state.
if (import.meta.env.DEV) Object.assign(window, { __floodpath: useAppStore });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
