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
      name: 'PicX',
      short_name: 'PicX',
      description:
        'PicX 是一款基于 GitHub API 开发的图床工具，提供图片上传托管、生成图片链接和常用图片工具箱服务。',
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
