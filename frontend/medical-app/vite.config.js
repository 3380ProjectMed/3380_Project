// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls. We need two entries:
      // 1) /api/doctor_api/* -> strip the /api prefix so it becomes /doctor_api/* on the backend
      //    (those files live under /doctor_api in backend/public)
      '/api/doctor_api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 2) all other /api/* endpoints (for example /api/login.php) should be forwarded unchanged
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
