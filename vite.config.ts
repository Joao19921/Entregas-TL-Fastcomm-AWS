import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Entregas-TL-Fastcomm-AWS/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
