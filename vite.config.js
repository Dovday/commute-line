import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rfi': {
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures/Monitor',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rfi\/(.*)/, '?arrivals=False&placeId=$1'),
      },
      '/stations': {
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stations/, '')
      }
    }
  }
})
