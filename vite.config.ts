import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig({
  plugins: [react()],
  base: '/wego-game/',
  server: {
    port: 3002,
  },
  define: {
    APP_VERSION: JSON.stringify(pkg.version),
  },
})
