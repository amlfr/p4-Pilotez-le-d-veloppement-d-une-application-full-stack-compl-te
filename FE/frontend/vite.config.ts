import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Spring Boot backend so the dev server
    // and the API share an origin (no CORS configuration needed).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
