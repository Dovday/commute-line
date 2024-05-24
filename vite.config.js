import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rfi': {
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures/Monitor?arrivals=False&placeId=1852',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rfi/, ''),
      },
      '/stations': {
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stations/, '')
      }
    }
  }
})
