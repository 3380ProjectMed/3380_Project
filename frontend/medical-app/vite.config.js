// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Do not rewrite - keep /api prefix so frontend /api/* calls map to backend /api/*
      },
      // Proxy patient_api.php requests (backend file sits at /patient_api.php)
      '/patient_api.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})