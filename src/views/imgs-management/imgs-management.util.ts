import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { ImageSortEnum } from '@/common/model'
import { store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'

export { getDirContent }

/**
 * 名称比较（数字感知，img2 排在 img10 之前）
 */
const compareByName = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

/**
 * 图床管理页目录列表排序（返回新数组，不修改 Store 中的原始顺序）
 * @param dirList 目录列表。
 * @param sort 排序模式。
 */
export function sortDirList(dirList: DirObject[], sort: ImageSortEnum): DirObject[] {
  if (sort === ImageSortEnum.nameAsc) {
    return [...dirList].sort((a, b) => compareByName(a.dir, b.dir))
  }
  if (sort === ImageSortEnum.nameDesc) {
    return [...dirList].sort((a, b) => compareByName(b.dir, a.dir))
  }
  return dirList
}

/**
 * 图床管理页图片列表排序（返回新数组，不修改 Store 中的原始顺序）
 * 最新上传优先时，未知上传时间的文件排在已知时间文件之后
 * @param imageList 图片列表。
 * @param sort 排序模式。
 */
export function sortImageList(
  imageList: UploadedImageModel[],
  sort: ImageSortEnum,
): UploadedImageModel[] {
  if (sort === ImageSortEnum.nameAsc || sort === ImageSortEnum.nameDesc) {
    const order = sort === ImageSortEnum.nameAsc ? 1 : -1
    return [...imageList].sort((a, b) => order * compareByName(a.name, b.name))
  }
  if (sort === ImageSortEnum.timeDesc) {
    return [...imageList].sort((a, b) => (b.uploadTime ?? 0) - (a.uploadTime ?? 0))
  }
  return imageList
}

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
