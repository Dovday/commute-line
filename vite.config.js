import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/autocomplete': {
      //   target: 'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/autocomplete\/(.*)/, '$1'),
      // },
      // '/solutions': {
      //   target: 'http://www.viaggiatreno.it/viaggiotrenonew/resteasy/viaggiotreno/soluzioniViaggioNew/',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/solutions\/(.*)/, '$1'),
      // },
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
