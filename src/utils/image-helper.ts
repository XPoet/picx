import { UploadedImageModel } from '@/common/model'
import { getUuid } from '@/utils/common-utils'

export default function structureImageObject(item: any, selectedDir: string): UploadedImageModel {
  return {
    type: 'image',
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    sha: item.sha,
    path: item.path,
    deleting: false,
    size: item.size,
    checked: false
  }
}
