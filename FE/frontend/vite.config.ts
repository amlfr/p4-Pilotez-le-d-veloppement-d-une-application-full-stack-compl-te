import { defineConfig } from 'vitest/config'
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
  test: {
    // globals exposes afterEach for @testing-library's automatic DOM cleanup.
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
    },
  },
})
