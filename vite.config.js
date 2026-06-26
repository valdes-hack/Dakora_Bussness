import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Découpe le bundle en chunks séparés pour un meilleur cache navigateur
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'supabase':       ['@supabase/supabase-js'],
          'ui-icons':       ['lucide-react'],
          'leaflet':        ['leaflet', 'react-leaflet'],
        }
      }
    },
    // Compression maximale
    minify: 'esbuild',
    target: 'es2020',
    // Avertissement à partir de 600kb seulement
    chunkSizeWarningLimit: 600,
  },

  // Pré-bundling agressif des dépendances pour le dev
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@supabase/supabase-js', 'lucide-react'
    ]
  },

  server: {
    // HMR plus rapide en dev
    hmr: { overlay: true },
  }
})
