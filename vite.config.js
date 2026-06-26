import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Compression maximale
    minify: 'esbuild',
    target: 'es2020',
    // Avertissement à partir de 600kb seulement
    chunkSizeWarningLimit: 600,
  },

  // Désactiver Rolldown pour utiliser Rollup classique (compatibilité Tailwind v4)
  experimental: {
    rollup: true,
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
