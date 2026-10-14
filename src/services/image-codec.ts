import type { CompressEncoderEnum } from '@/common/model'

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
export function encodeImage(file: File, encoder: CompressEncoderEnum): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/image-codec.worker.ts', import.meta.url), {
      type: 'module',
    })
    const requestId = crypto.randomUUID()

    const dispose = (): void => {
      worker.terminate()
    }

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
        new File([event.data.buffer], `${nameWithoutExtension}.${event.data.extension}`, {
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
      encoder,
    }
    worker.postMessage(request)
  })
}
