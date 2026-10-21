import type { UploadedImageModel } from '@/common/model'

export interface MediaPropertiesDialogProps {
  image: UploadedImageModel | null
}

export interface MediaPropertiesDialogEmits {
  'update:image': [image: UploadedImageModel | null]
}
