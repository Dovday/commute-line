import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rfi': {
        // target: 'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/mo',
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures/Monitor?placeId=1852&arrivals=True',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rfi/, ''),
      },
      '/monitor': {
        target: 'https://iechub.rfi.it/ArriviPartenze/ArrivalsDepartures',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/monitor/, '')
      }
    }
  }
})
