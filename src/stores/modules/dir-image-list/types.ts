import { UploadedImageModel } from '@/common/model'

export interface DirObject {
  type: 'dir'
  dir: string
  dirPath: string
  childrenDirs: DirObject[]
  imageList: UploadedImageModel[]
}

export default interface DirImageListStateTypes {
  name: string
  dirObject: DirObject
}
