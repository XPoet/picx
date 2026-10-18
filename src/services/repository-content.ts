import type { UserConfigInfoModel } from '@/common/model'
import type { ApiResult } from '@/utils/request/types'
import { getRepoPathContentResult } from '@/common/api/dir'
import { store } from '@/stores'
import { createDirObject, getDirContent } from '@/stores/modules/dir-image-list/utils'
import { getFileSuffix, isImage, isVideo } from '@/utils/file-utils'
import { createManagementImageObject } from '@/utils/image-utils'

/** 成功后一次替换直属内容；失败与迟到请求不修改已展示缓存。 */
export async function refreshManagementDirectory(config: Pick<UserConfigInfoModel, 'owner' | 'repo' | 'branch'>, path: string, canCommit = () => true): Promise<ApiResult<void>> {
  const result = await getRepoPathContentResult(config, path)
  if (!result.ok)
    return result
  if (!canCommit())
    return { ok: true, data: undefined }
  const previous = getDirContent(path, store.getters.getDirObject)
  const directories = result.data.filter(item => item.type === 'dir').map(item => previous?.childrenDirs.find(child => child.dirPath === item.path) ?? createDirObject(item.name, item.path))
  const images = result.data.filter(item => item.type === 'file' && (isImage(getFileSuffix(item.name)) || isVideo(getFileSuffix(item.name)))).map((item) => {
    const existing = previous?.imageList.find(image => image.path === item.path && image.sha === item.sha)
    return existing ? { ...existing, size: item.size, checked: false, deleting: false, active: false } : createManagementImageObject(item, path, isVideo(item.name) ? 'video' : 'image')
  })
  try {
    await store.dispatch('DIR_IMAGE_LIST_REPLACE_CONTENT', { path, directories, images })
  }
  catch {
    return { ok: false, error: { kind: 'service', retryable: true } }
  }
  return { ok: true, data: undefined }
}

/** 保留未迁移调用方的 boolean / null 返回。 */
export async function loadRepositoryContent(config: UserConfigInfoModel, path = '/') {
  const result = await refreshManagementDirectory(config, path || '/')
  return result.ok ? true : null
}
