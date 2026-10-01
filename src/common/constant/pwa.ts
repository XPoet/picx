/**
 * Service Worker 图片运行时缓存名（src/plugins/vite/pwa.ts 与 src/utils/image-cache-utils.ts 共享）
 * 独立成文件：vite.config 打包时不能引入含浏览器 API 或副作用的模块
 */
export const PICX_IMAGE_RUNTIME_CACHE_NAME = 'picx-image-hosting-runtime'
