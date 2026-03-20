import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // Output directory for production build
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    // Improve chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'framer-motion',
            'recharts',
            'zustand'
          ],
          'ui': [
            'lucide-react',
            '@heroicons/react'
          ]
        }
      }
    },
  },
  // Ensure environment variables are correctly included in the build
  define: {
    'process.env': {}
  },
  // Enable hash-based routing for SPA
  server: {
    historyApiFallback: true
  }
});
