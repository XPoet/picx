/**
 * Zero config PWA for Vite
 * Plugin: vite-plugin-pwa
 * https://github.com/antfu/vite-plugin-pwa
 */
import { VitePWA } from 'vite-plugin-pwa'
import { PICX_IMAGE_RUNTIME_CACHE_NAME } from '../../common/constant/pwa'

// 仅内置图片链接预设的域名（GitHub / GitHub Pages / jsDelivr / Statically / 国内 jsDelivr），
// 自定义链接规则的域名无法在构建期得知；视频走 Range 请求，交给浏览器自身缓存
const IMAGE_RUNTIME_CACHE_URL_PATTERN
  = /^https?:\/\/(?:raw\.githubusercontent\.com|github\.com\/[^/]+\/[^/]+\/raw|cdn\.jsdelivr\.net\/gh|cdn\.statically\.io\/gh|jsd\.cdn\.zzko\.cn\/gh|[a-z0-9-]+\.github\.io)\/.+\.(?:png|jpe?g|gif|webp|avif|bmp|ico|svg)(?:\?.*)?$/i

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
          type: 'image/png',
        },
        {
          src: './logo@512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      runtimeCaching: [
        {
          urlPattern: /\.wasm$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'picx-image-codecs',
            expiration: {
              maxEntries: 24,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
          },
        },
        {
          // StaleWhileRevalidate：先回缓存秒开，后台再校验更新；
          // <img> 请求为 no-cors，响应是 opaque（status 0），必须放行 [0, 200] 才会入缓存
          urlPattern: IMAGE_RUNTIME_CACHE_URL_PATTERN,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: PICX_IMAGE_RUNTIME_CACHE_NAME,
            expiration: {
              maxEntries: 500,
              maxAgeSeconds: 60 * 60 * 24 * 30,
              purgeOnQuotaError: true,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
      skipWaiting: true,
    },
  })
}
