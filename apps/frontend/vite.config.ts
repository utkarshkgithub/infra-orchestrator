import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The backend does not send CORS headers (apps/backend/src/app.ts has the
// cors middleware commented out), so in development the browser must talk to
// one origin only. The dev server proxies the API paths to the backend.
const API_TARGET = process.env.VITE_DEV_API_URL ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '^/(auth|project|deployment|health)(/|$)': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
