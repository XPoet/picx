import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'

export { getDirContent }

/**
 * 获取当前目录下所有内容（子目录和文件，文件包含图片和视频）
 * @param content 当前目录内容。
 * @param type 要筛选的内容类型。
 */
export function filterDirContent(content: DirObject, type: 'dir'): DirObject[]
export function filterDirContent(content: DirObject, type: 'file'): UploadedImageModel[]
export function filterDirContent(
  content: DirObject,
  type: 'dir' | 'file',
): DirObject[] | UploadedImageModel[] {
  if (type === 'dir') {
    return content.childrenDirs.filter(directory => directory.type === 'dir')
  }

  return content.imageList.filter(file => file.type === 'image' || file.type === 'video')
}

export const shiftKeyHandle = () => {
  document.addEventListener('keydown', (e) => {
    const keyCode = e.keyCode || e.which || e.charCode
    if (keyCode === 16) {
      store.commit('SET_UPLOAD_AREA_STATE', {
        pressShiftKey: true,
      })
    }
  })

  document.addEventListener('keyup', (e) => {
    const keyCode = e.keyCode || e.which || e.charCode
    if (keyCode === 16) {
      store.commit('SET_UPLOAD_AREA_STATE', {
        pressShiftKey: false,
      })
    }
  })
}
