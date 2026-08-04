import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precarga el "app shell" (HTML, JS, CSS, íconos) para que abra sin red
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Tracker Hacienda',
        short_name: 'Hacienda',
        description: 'Seguimiento de producción de leche y manejo de hacienda',
        theme_color: '#863bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precachea todos los archivos generados en el build (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Llamadas a Supabase: SIEMPRE intenta la red primero (son datos en vivo).
            // Si no hay conexión, cae al caché más reciente en vez de fallar.
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
        // Permite que rutas internas de React funcionen offline (SPA fallback)
        navigateFallback: '/index.html',
      },
      devOptions: {
        // Habilita el Service Worker también en `npm run dev` para poder probarlo
        enabled: true,
        type: 'module',
      },
    }),
  ],
})