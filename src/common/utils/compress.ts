import { store } from '@/store'
import Compress from '@yireen/squoosh-browser'
import {
  defaultPreprocessorState,
  defaultProcessorState,
  encoderMap,
  EncoderState
} from '@yireen/squoosh-browser/dist/client/lazy-app/feature-meta'
import { UserConfigInfoModel } from '../model/userConfigInfo.model'

export enum CompressMethod {
  mozJPEG = 'mozJPEG',
  avif = 'avif',
  webP = 'webP'
}

const defaultEncoderState: EncoderState = {
  type: 'mozJPEG',
  options: encoderMap.mozJPEG.meta.defaultOptions
}

const compress = async (file: File, compressMethod: CompressMethod) => {
  let encoderState: EncoderState
  switch (compressMethod) {
    case CompressMethod.mozJPEG:
      encoderState = defaultEncoderState
      break

    case CompressMethod.avif:
      encoderState = {
        type: 'avif',
        options: encoderMap.avif.meta.defaultOptions
      }
      break

    case CompressMethod.webP:
      encoderState = {
        type: 'webP',
        options: encoderMap.webP.meta.defaultOptions
      }
      break

    default:
      encoderState = defaultEncoderState
      break
  }

  const compress = new Compress(file, {
    encoderState,
    processorState: defaultProcessorState,
    preprocessorState: defaultPreprocessorState
  })

  return compress.process()
}

export { compress }
