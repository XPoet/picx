import type { ContextmenuEnum } from '@/common/directive/types'
import type { UploadedImageModel } from '@/common/model'

export interface UploadAreaActiveInfo {
  dir?: string
  type?: ContextmenuEnum
  img?: UploadedImageModel
}

export default interface UploadAreaStateTypes {
  isActive: boolean
  isPaste: boolean
  pressShiftKey: boolean
  activeInfo: UploadAreaActiveInfo | null
}
