/**
 * Zero config PWA for Vite
 * Plugin: vite-plugin-pwa
 * https://github.com/antfu/vite-plugin-pwa
 */
import { VitePWA } from 'vite-plugin-pwa'

export default function configPWAPlugin() {
  return VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'PicX 图床',
      short_name: 'PicX',
      icons: [
        {
          src: './logo@192x192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      skipWaiting: true
    }
  })
}
