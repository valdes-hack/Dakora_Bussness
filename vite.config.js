import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Configuration PWA ultra-pro
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon/favicon.ico', 'icon/apple-touch-icon.png'],
      manifest: {
        name: 'Dakora Business',
        short_name: 'Dakora',
        description: 'Équipements et matériels agricoles au Cameroun',
        theme_color: '#2D5A27',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon/ms-icon-310x310.png',
            sizes: '310x310',
            type: 'image/png',
            purpose: 'any maskable'
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