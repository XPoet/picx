import type { CompressEncoderEnum } from '@/common/model'
import { CompressEncoderEnum as Encoder } from '@/common/model'

interface EncodeImageRequest {
  id: string
  file: File
  encoder: CompressEncoderEnum
}

interface EncodeImageResult {
  id: string
  ok: true
  buffer: ArrayBuffer
  mimeType: string
  extension: string
}

interface EncodeImageError {
  id: string
  ok: false
  message: string
}

interface EncoderOutput {
  buffer: ArrayBuffer
  mimeType: string
  extension: string
}

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope

/**
 * 把浏览器可解码的图片文件转换为编码器需要的 RGBA 像素数据。
 */
async function decodeImage(file: File): Promise<ImageData> {
  const imageBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
  const context = canvas.getContext('2d')

  if (!context) {
    imageBitmap.close()
    throw new Error('当前浏览器无法创建离屏画布。')
  }

  context.drawImage(imageBitmap, 0, 0)
  imageBitmap.close()
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/**
 * 按用户选择的编码器动态加载对应的 jSquash WASM 模块。
 */
async function encode(imageData: ImageData, encoder: CompressEncoderEnum): Promise<EncoderOutput> {
  switch (encoder) {
    case Encoder.mozJPEG: {
      const { encode: encodeJpeg } = await import('@jsquash/jpeg')
      return {
        buffer: await encodeJpeg(imageData),
        mimeType: 'image/jpeg',
        extension: 'jpg',
      }
    }

    case Encoder.avif: {
      const { encode: encodeAvif } = await import('@jsquash/avif')
      return {
        buffer: await encodeAvif(imageData),
        mimeType: 'image/avif',
        extension: 'avif',
      }
    }

    case Encoder.webP: {
      const { encode: encodeWebp } = await import('@jsquash/webp')
      return {
        buffer: await encodeWebp(imageData),
        mimeType: 'image/webp',
        extension: 'webp',
      }
    }

    case Encoder.png: {
      const { optimise: optimisePng } = await import('@jsquash/oxipng')
      return {
        buffer: await optimisePng(imageData, { level: 3, optimiseAlpha: true }),
        mimeType: 'image/png',
        extension: 'png',
      }
    }

    default:
      throw new Error(`不支持的图片编码器：${encoder}`)
  }
}

workerScope.addEventListener('message', async (event: MessageEvent<EncodeImageRequest>) => {
  const { id, file, encoder } = event.data

  try {
    const imageData = await decodeImage(file)
    const output = await encode(imageData, encoder)
    const response: EncodeImageResult = {
      id,
      ok: true,
      ...output,
    }
    workerScope.postMessage(response, { transfer: [response.buffer] })
  }
  catch (error) {
    const response: EncodeImageError = {
      id,
      ok: false,
      message: error instanceof Error ? error.message : '图片编码失败。',
    }
    workerScope.postMessage(response)
  }
})
