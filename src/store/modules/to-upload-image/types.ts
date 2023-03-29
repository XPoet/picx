import { ToUploadImageModel } from '@/common/model'

export default interface ToUploadImageStateTypes {
  curImgBase64Url: string
  curImgUuid: string
  list: ToUploadImageModel[]
  uploadedNumber: number
}
