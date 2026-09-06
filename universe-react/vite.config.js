import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep React + Router in a long-lived cacheable vendor chunk so the
        // entry bundle is smaller and vendor code is shared across all routes.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router')
            ) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },
  server: {
    allowedHosts: ['from-bonfire-aloft.ngrok-free.dev'],
  },
})
