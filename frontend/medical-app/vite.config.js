// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev: /api/**  -> http://localhost:8080/**
      '^/api/(.*)': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\//, ''), // drop "/api/"
      },
    },
  },
})
