/**
 * Zero config PWA for Vite
 * Plugin: vite-plugin-pwa
 * https://github.com/antfu/vite-plugin-pwa
 */
import { VitePWA } from 'vite-plugin-pwa'
import { ViteEnv } from '@/common/model/vite-config.model'

export default function configPWAPlugin(env: ViteEnv) {
  return VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: env.VITE_GLOB_APP_TITLE,
      short_name: env.VITE_GLOB_APP_SHORT_NAME,
      icons: [
        {
          src: './logo@192x192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    }
  })
}
