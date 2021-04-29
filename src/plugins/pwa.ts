/**
 * Zero config PWA for Vite
 * https://github.com/antfu/vite-plugin-pwa
 */
import { ViteEnv } from '@/common/model/viteConfig.model'
import { VitePWA } from 'vite-plugin-pwa'

export default function configPWAPlugin(env: ViteEnv) {
  // vite-plugin-pwa
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
        },
        {
          src: './logo@512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })
}
