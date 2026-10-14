import { PICX_IMAGE_RUNTIME_CACHE_NAME } from '@/common/constant'

/**
 * 清理 Service Worker 图片运行时缓存中命中指定仓库路径的条目，
 * 供上传覆盖、删除、移动、重命名成功后调用，避免管理页继续展示已被替换或删除的图片。
 * 缓存条目可能来自任意链接预设的域名，故按 URL path 后缀匹配而非完整 URL 匹配
 * @param paths 仓库内受影响的文件路径列表，如 ['dir/a.png']
 */
export async function purgeImageRuntimeCache(paths: string[]): Promise<void> {
  const targets = paths
    .filter(x => !!x)
    .map(x => `/${x.replace(/^\/+/, '')}`)
  if (!targets.length || typeof caches === 'undefined') {
    return
  }

  try {
    const cache = await caches.open(PICX_IMAGE_RUNTIME_CACHE_NAME)
    const requests = await cache.keys()
    await Promise.all(
      requests.map(async (request) => {
        const pathname = decodeURIComponent(new URL(request.url).pathname)
        if (targets.some(p => pathname.endsWith(p))) {
          await cache.delete(request, { ignoreVary: true })
        }
      }),
    )
  }
  catch {
    // 清理失败不影响主流程，最多表现为管理页短暂展示旧图
  }
}
