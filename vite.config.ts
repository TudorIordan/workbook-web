import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/workbook-web/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'favicon.svg', 'fonts/*.woff2', 'screenshots/*.png'],
      manifest: {
        name: 'Workbook',
        short_name: 'Workbook',
        description: 'Log your lifts. Watch them move.',
        start_url: `${base}?source=pwa`,
        scope: base,
        id: base,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        background_color: '#f2ece1',
        theme_color: '#9c3b34',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Start empty workout',
            url: `${base}?action=start-empty`,
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'History',
            url: `${base}?tab=history`,
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        screenshots: [
          { src: 'screenshots/wide.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'Workbook on desktop' },
          { src: 'screenshots/narrow.png', sizes: '750x1334', type: 'image/png', form_factor: 'narrow', label: 'Workbook on mobile' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        runtimeCaching: [],
      },
    }),
  ],
})
