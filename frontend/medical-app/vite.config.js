// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // anything under /api/* goes to backend/public (docroot) unchanged
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // no rewrite because the files actually live under /api/
      },
    },
  },
})
