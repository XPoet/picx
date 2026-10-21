import type { ProcessingSnapshot } from '@/common/model/upload'
import { addWatermarkToImage } from '@/utils/add-watermark'
import { compressImage } from '@/utils/compress-image'
import { isNeedCompress, isNeedWatermark } from '@/utils/file-utils'
import { imgFileToBase64 } from '@/utils/image-utils'

export interface ImageProcessingResult {
  finalFile: File
  watermarkFile: File | null
  watermarkBase64: string | null
  compressFile: File | null
  compressBase64: string | null
  skippedProcessing: boolean
}
export class ImageProcessingError extends Error {
  constructor(readonly reason: 'decode' | 'watermark' | 'encode') {
    super(reason)
  }
}
export async function processImage(
  original: File,
  settings: ProcessingSnapshot,
  signal: AbortSignal,
  onStage: (stage: 'watermark' | 'compress') => void,
): Promise<ImageProcessingResult> {
  const result: ImageProcessingResult = { finalFile: original, watermarkFile: null, watermarkBase64: null, compressFile: null, compressBase64: null, skippedProcessing: false }
  signal.throwIfAborted()
  if (!isNeedCompress(original.type)) {
    result.skippedProcessing = settings.compress.enable || settings.watermark.enable
    return result
  }
  let step: 'watermark' | 'compress' = 'watermark'
  try {
    if (settings.watermark.enable && settings.watermark.text && isNeedWatermark(original.type)) {
      onStage(step)
      const file = await addWatermarkToImage(original, settings.watermark)
      signal.throwIfAborted()
      if (!file)
        throw new ImageProcessingError('watermark')
      const base64 = await imgFileToBase64(file)
      if (!base64)
        throw new ImageProcessingError('decode')
      result.watermarkFile = file
      result.watermarkBase64 = base64
      result.finalFile = file
    }
    signal.throwIfAborted()
    if (settings.compress.enable) {
      step = 'compress'
      onStage(step)
      const file = await compressImage(result.finalFile, settings.compress.encoder, signal)
      signal.throwIfAborted()
      if (file.size < result.finalFile.size) {
        const base64 = await imgFileToBase64(file)
        if (!base64)
          throw new ImageProcessingError('decode')
        result.compressFile = file
        result.compressBase64 = base64
        result.finalFile = file
      }
    }
    signal.throwIfAborted()
    return result
  }
  catch (error: unknown) {
    signal.throwIfAborted()
    throw error instanceof ImageProcessingError ? error : new ImageProcessingError(step === 'watermark' ? 'watermark' : 'encode')
  }
}
