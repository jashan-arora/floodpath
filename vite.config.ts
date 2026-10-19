import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets BASE_PATH. Locally it's '/'.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // React, Leaflet and the map icons ship in one ~235 kB (gzipped) bundle; that's fine for this app.
  build: { chunkSizeWarningLimit: 900 },
})
