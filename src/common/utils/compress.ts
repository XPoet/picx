import Compress from '@yireen/squoosh-browser'
import {
  defaultPreprocessorState,
  defaultProcessorState,
  encoderMap,
  EncoderState
} from '@yireen/squoosh-browser/dist/client/lazy-app/feature-meta'

export enum CompressEncoderMap {
  mozJPEG = 'mozJPEG',
  avif = 'avif',
  webP = 'webP'
}

export const compress = async (file: File, encoder: CompressEncoderMap) => {
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
