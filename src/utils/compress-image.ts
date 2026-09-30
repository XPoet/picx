import type { CompressEncoderEnum } from '@/common/model'
import { encodeImage } from '@/services/image-codec'
import { isNeedCompress } from '@/utils/file-utils'

/**
 * 压缩图片
 * @param file
 * @param encoder
 */
export const compressImage = async (file: File, encoder: CompressEncoderEnum) => {
  if (isNeedCompress(file.type)) {
    return encodeImage(file, encoder)
  }

  return file
}
