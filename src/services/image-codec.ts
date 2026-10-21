import { CompressEncoderEnum } from '@/common/model'

const originalEncoders: Readonly<Record<string, CompressEncoderEnum | undefined>> = {
  'image/png': CompressEncoderEnum.png,
  'image/jpeg': CompressEncoderEnum.mozJPEG,
  'image/jpg': CompressEncoderEnum.mozJPEG,
  'image/webp': CompressEncoderEnum.webP,
  'image/avif': CompressEncoderEnum.avif,
}

interface EncodeImageRequest {
  id: string
  file: File
  encoder: CompressEncoderEnum
}

interface EncodeImageSuccess {
  id: string
  ok: true
  buffer: ArrayBuffer
  mimeType: string
  extension: string
}

interface EncodeImageFailure {
  id: string
  ok: false
  message: string
}

type EncodeImageResponse = EncodeImageSuccess | EncodeImageFailure

/**
 * 使用独立 Worker 编码图片，并在任务结束后释放 Worker。
 */
export function encodeImage(file: File, encoder: CompressEncoderEnum, signal?: AbortSignal): Promise<File> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const resolvedEncoder = encoder === CompressEncoderEnum.original ? originalEncoders[file.type.toLowerCase()] : encoder
    if (!resolvedEncoder) {
      resolve(file)
      return
    }
    const worker = new Worker(new URL('../workers/image-codec.worker.ts', import.meta.url), {
      type: 'module',
    })
    const requestId = crypto.randomUUID()

    function dispose(): void {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
    }
    function abort(): void {
      dispose()
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', abort, { once: true })

    worker.addEventListener('message', (event: MessageEvent<EncodeImageResponse>) => {
      if (event.data.id !== requestId) {
        return
      }

      dispose()

      if (!event.data.ok) {
        reject(new Error(event.data.message))
        return
      }

      const nameWithoutExtension = file.name.replace(/\.[^.]+$/, '')
      resolve(
        new File([event.data.buffer], encoder === CompressEncoderEnum.original ? file.name : `${nameWithoutExtension}.${event.data.extension}`, {
          type: event.data.mimeType,
          lastModified: file.lastModified,
        }),
      )
    })

    worker.addEventListener('error', (event) => {
      dispose()
      reject(new Error(event.message || '图片编码 Worker 执行失败。'))
    })

    const request: EncodeImageRequest = {
      id: requestId,
      file,
      encoder: resolvedEncoder,
    }
    worker.addEventListener('messageerror', () => {
      dispose()
      reject(new Error('Image codec response could not be decoded'))
    }, { once: true })
    try {
      worker.postMessage(request)
    }
    catch (error: unknown) {
      dispose()
      reject(error)
    }
  })
}
