import type { UploadedImageModel } from '@/common/model'
import type { DirObject } from '@/stores/modules/dir-image-list/types'
import { ImageSortEnum } from '@/common/model/image'

export function directoryBreadcrumbs(path: string): Array<{ name: string, path: string }> {
  const segments = path.split('/').filter(Boolean)
  return [{ name: '/', path: '/' }, ...segments.map((name, index) => ({ name, path: segments.slice(0, index + 1).join('/') }))]
}

export function filterManagementContent(directories: readonly DirObject[], images: readonly UploadedImageModel[], query: string) {
  const term = query.trim().toLocaleLowerCase()
  return {
    directories: directories.filter(item => item.dir.toLocaleLowerCase().includes(term)),
    images: images.filter(item => item.name.toLocaleLowerCase().includes(term)),
  }
}

const compareName = (left: string, right: string) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })

export function sortDirList(directories: readonly DirObject[], mode: ImageSortEnum): DirObject[] {
  const result = [...directories]
  if (mode === ImageSortEnum.nameAsc || mode === ImageSortEnum.nameDesc) {
    const order = mode === ImageSortEnum.nameAsc ? 1 : -1
    result.sort((a, b) => order * compareName(a.dir, b.dir))
  }
  return result
}

export function sortImageList(images: readonly UploadedImageModel[], mode: ImageSortEnum): UploadedImageModel[] {
  const result = [...images]
  if (mode === ImageSortEnum.nameAsc || mode === ImageSortEnum.nameDesc) {
    const order = mode === ImageSortEnum.nameAsc ? 1 : -1
    result.sort((a, b) => order * compareName(a.name, b.name))
  }
  else if (mode === ImageSortEnum.timeDesc) {
    const time = (image: UploadedImageModel) => Number.isFinite(image.uploadTime) ? image.uploadTime ?? 0 : 0
    result.sort((a, b) => time(b) - time(a))
  }
  return result
}
