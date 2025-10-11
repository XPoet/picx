import { UploadedImageModel, UploadedVideoModel } from '@/common/model'

export interface DirObject {
  type: 'dir'
  dir: string
  dirPath: string
  childrenDirs: DirObject[]
  imageList: UploadedImageModel[]
  videoList: UploadedVideoModel[]
}

export default interface DirImageListStateTypes {
  name: string
  dirObject: DirObject
}
