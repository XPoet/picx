import type { UserConfigInfoModel } from '@/common/model'
import { getRepoPathContentResult } from '@/common/api/dir'
import { store } from '@/stores'
import { getFileSuffix, isImage, isVideo } from '@/utils/file-utils'
import { createManagementImageObject } from '@/utils/image-utils'

/** 兼容现有管理页刷新流程，API 不接触 Store。 */
export async function loadRepositoryContent(config: UserConfigInfoModel, path = '') {
  const result = await getRepoPathContentResult(config, path)
  if (!result.ok) {
    return null
  }
  for (const item of result.data) {
    if (item.type === 'dir') {
      await store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.path)
    }
    else if (item.type === 'file' && (isImage(getFileSuffix(item.name)) || isVideo(getFileSuffix(item.name)))) {
      await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', createManagementImageObject(item, path, isVideo(item.name) ? 'video' : 'image'))
    }
  }
  return true
}
