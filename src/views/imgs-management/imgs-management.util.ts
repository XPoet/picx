import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'

export { getDirContent }

/**
 * 获取当前目录下所有内容（子目录和图片）
 * @param content 当前目录内容。
 * @param type 要筛选的内容类型。
 */
export function filterDirContent(content: DirObject, type: 'dir'): DirObject[]
export function filterDirContent(content: DirObject, type: 'image'): UploadedImageModel[]
export function filterDirContent(
  content: DirObject,
  type: 'dir' | 'image',
): DirObject[] | UploadedImageModel[] {
  if (type === 'dir') {
    return content.childrenDirs.filter(directory => directory.type === 'dir')
  }

  return content.imageList.filter(image => image.type === 'image')
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
