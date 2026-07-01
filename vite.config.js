import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Configuration PWA ultra-pro
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon/favicon.ico',
        'icon/apple-touch-icon.png',
        'icon/android-icon-192x192.png',
        'icon/android-icon-144x144.png',
        'icon/ms-icon-310x310.png'
      ],
      manifest: {
        name: 'Dakora Business',
        short_name: 'Dakora',
        description: 'Équipements et matériels agricoles au Cameroun',
        theme_color: '#2D5A27',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon/ms-icon-310x310.png',
            sizes: '310x310',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon/apple-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60
              }
            }
          }
        ]
      }
    })
  ],

  build: {
    // Tes optimisations de compression
    minify: 'esbuild',
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: undefined // Garde les fichiers groupés comme tu as demandé
      }
    }
  },

  // Tes réglages pour un développement ultra-fluide
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js', 
      'lucide-react',
      'react-leaflet',
      'leaflet'
    ]
  },

  server: {
    // HMR (Hot Module Replacement) réactif
    hmr: { overlay: true },
    port: 5173,
    host: true // Permet d'ouvrir le site sur ton téléphone via ton IP locale
  }
})