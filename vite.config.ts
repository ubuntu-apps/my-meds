import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/my-meds/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      includeAssets: ['favicon.svg', 'icons/meds-180.png'],
      manifest: {
        name: 'My Meds',
        short_name: 'My Meds',
        description: 'Track your daily medications, confirm doses, and get reminders.',
        theme_color: '#0f766e',
        background_color: '#042f2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/my-meds/',
        scope: '/my-meds/',
        icons: [
          {
            src: 'icons/meds-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/meds-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/meds-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
