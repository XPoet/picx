import Compress from '@yireen/squoosh-browser'
import {
  defaultPreprocessorState,
  defaultProcessorState,
  encoderMap,
  EncoderState
} from '@yireen/squoosh-browser/dist/client/lazy-app/feature-meta'
import { CompressEncoderEnum } from '@/common/model'
import { isNeedCompress } from '@/utils/file-utils'

/**
 * 压缩图片
 * @param file
 * @param encoder
 */
export const compressImage = async (file: File, encoder: CompressEncoderEnum) => {
  if (isNeedCompress(file.type)) {
    const compress = new Compress(file, {
      encoderState: {
        type: encoder,
        options: encoderMap[encoder].meta.defaultOptions
      } as EncoderState,
      processorState: defaultProcessorState,
      preprocessorState: defaultPreprocessorState
    })
    return compress.process()
  }

  return file
}
