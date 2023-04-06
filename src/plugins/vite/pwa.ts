/**
 * Zero config PWA for Vite
 * Plugin: vite-plugin-pwa
 * https://github.com/antfu/vite-plugin-pwa
 */
import { VitePWA } from 'vite-plugin-pwa'

export default function configPWAPlugin() {
  return VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    manifest: {
      name: 'PicX 图床',
      short_name: 'PicX',
      description:
        'PicX 是一款基于 GitHub API 开发的图床工具，提供图片上传托管和生成图片链接服务。',
      icons: [
        {
          src: './logo@192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: './logo@512x512.png',
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
