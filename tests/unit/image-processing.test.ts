import type { ImageProcessingResult } from '@/services/image-processing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { CompressEncoderEnum } from '@/common/model'
import { useUploadWorkspace } from '@/composables/use-upload-workspace'
import { encodeImage } from '@/services/image-codec'
import { processImage } from '@/services/image-processing'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { addWatermarkToImage } from '@/utils/add-watermark'
import { compressImage } from '@/utils/compress-image'
import { createUploadImageObject, imgFileToBase64 } from '@/utils/image-utils'
import { createSettingsFixture } from '../fixtures/ui-redesign'

vi.mock('@/utils/add-watermark', () => ({ addWatermarkToImage: vi.fn() }))
vi.mock('@/utils/compress-image', () => ({ compressImage: vi.fn() }))
vi.mock('@/utils/image-utils', async importOriginal => ({ ...await importOriginal<typeof import('@/utils/image-utils')>(), imgFileToBase64: vi.fn(async () => 'data:image/png;base64,fixture') }))
const scopes: ReturnType<typeof effectScope>[] = []
beforeEach(() => {
  usePicxStore(pinia).$reset()
  vi.mocked(addWatermarkToImage).mockReset()
  vi.mocked(compressImage).mockReset()
})
afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop())
  vi.unstubAllGlobals()
})
const result = (file: File): ImageProcessingResult => ({ finalFile: file, watermarkFile: null, watermarkBase64: null, compressFile: null, compressBase64: null, skippedProcessing: false })
function item() {
  const value = createUploadImageObject()
  value.uuid = crypto.randomUUID()
  value.fileInfo.originalFile = new File(['original'], 'a.png', { type: 'image/png' })
  value.filename.name = 'a'
  return value
}
function settings() {
  const value = createSettingsFixture()
  Object.assign(value.watermark, { enable: true, text: 'test' })
  value.compress.enable = true
  return { ...value, revision: 1 }
}

describe('图片处理服务与卡片无关', () => {
  it('原文件先水印再压缩，只采用更小的产物', async () => {
    const original = new File(['original'], 'a.png', { type: 'image/png' })
    const marked = new File(['marked'], 'a.png', { type: 'image/png' })
    const compressed = new File(['x'], 'a.webp', { type: 'image/webp' })
    vi.mocked(addWatermarkToImage).mockResolvedValue(marked)
    vi.mocked(compressImage).mockResolvedValue(compressed)
    const stages: string[] = []
    const processed = await processImage(original, settings(), new AbortController().signal, stage => stages.push(stage))
    expect(stages).toEqual(['watermark', 'compress'])
    expect(addWatermarkToImage).toHaveBeenCalledWith(original, expect.any(Object))
    expect(compressImage).toHaveBeenCalledWith(marked, expect.any(String), expect.any(AbortSignal))
    expect(processed.finalFile).toBe(compressed)
    expect(processed.watermarkFile).toBe(marked)
  })
  it('视频和 GIF 跳过处理，编码变大则保留输入', async () => {
    for (const type of ['video/mp4', 'image/gif']) {
      const file = new File(['x'], 'a', { type })
      expect((await processImage(file, settings(), new AbortController().signal, vi.fn())).skippedProcessing).toBe(true)
    }
    expect(compressImage).not.toHaveBeenCalled()
    const original = new File(['x'], 'a.png', { type: 'image/png' })
    const config = settings()
    config.watermark.enable = false
    vi.mocked(compressImage).mockResolvedValue(new File(['larger'], 'a.webp'))
    expect(await processImage(original, config, new AbortController().signal, vi.fn())).toMatchObject({ finalFile: original, compressFile: null })
  })
  it('水印失败与无法读取产物显式失败，不调用后续编码', async () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    vi.mocked(addWatermarkToImage).mockResolvedValue(null)
    await expect(processImage(file, settings(), new AbortController().signal, vi.fn())).rejects.toMatchObject({ reason: 'watermark' })
    expect(compressImage).not.toHaveBeenCalled()
    vi.mocked(addWatermarkToImage).mockResolvedValue(file)
    vi.mocked(imgFileToBase64).mockResolvedValueOnce(null)
    await expect(processImage(file, settings(), new AbortController().signal, vi.fn())).rejects.toMatchObject({ reason: 'decode' })
  })
  it('未渲染卡片也处理；配置更新作废旧任务，从原文件重算；移除不被回写', async () => {
    const store = usePicxStore(pinia)
    store.UPLOAD_IMG_LIST_ADD(item())
    const pending: ((value: ImageProcessingResult) => void)[] = []
    const processor = vi.fn(() => new Promise<ImageProcessingResult>(resolve => pending.push(resolve)))
    const scope = effectScope()
    scopes.push(scope)
    scope.run(() => useUploadWorkspace(processor))
    expect(processor).toHaveBeenCalledTimes(1)
    const original = store.getUploadImageList[0].fileInfo.originalFile
    store.getUserSettings.compress.enable = !store.getUserSettings.compress.enable
    await nextTick()
    expect(processor).toHaveBeenCalledTimes(2)
    expect(processor.mock.calls.every(args => args[0] === original)).toBe(true)
    const old = new File(['old'], 'old.webp')
    pending[0]({ ...result(old), compressFile: old })
    await nextTick()
    expect(store.getUploadImageList[0].fileInfo.compressFile).toBeNull()
    store.UPLOAD_IMG_LIST_RESET()
    await nextTick()
    pending[1]({ ...result(old), compressFile: old })
    await nextTick()
    expect(store.uploadRuntime).toEqual({})
    expect(store.getUploadImageList).toEqual([])
  })
  it('失败收尾、重试以及 scope 停止均可观察', async () => {
    const store = usePicxStore(pinia)
    const image = item()
    store.UPLOAD_IMG_LIST_ADD(image)
    const processor = vi.fn<typeof processImage>().mockRejectedValueOnce(new Error('fixture'))
    const scope = effectScope()
    scopes.push(scope)
    const workspace = scope.run(() => useUploadWorkspace(processor))
    await vi.waitFor(() => expect(store.uploadRuntime[image.uuid]?.phase).toBe('failed'))
    expect(image.beforeUploadStatus).toEqual({ watermarking: false, compressing: false })
    processor.mockImplementation(() => new Promise(() => {}))
    workspace?.retryProcessing(image.uuid)
    const signal = processor.mock.calls[1][2]
    scope.stop()
    expect(signal.aborted).toBe(true)
    expect(store.uploadRuntime[image.uuid]).toBeUndefined()
  })
})

describe('worker 生命周期', () => {
  it.each(['success', 'error', 'messageerror', 'post-error', 'abort'])('%s 结束后释放 Worker', async (mode) => {
    let id = ''
    class WorkerFixture extends EventTarget {
      static instance: WorkerFixture | undefined
      terminate = vi.fn()
      constructor() {
        super()
        WorkerFixture.instance = this
      }

      postMessage(request: { id: string }) {
        id = request.id
        if (mode === 'post-error')
          throw new Error('fixture')
      }
    }
    vi.stubGlobal('Worker', WorkerFixture)
    const controller = new AbortController()
    const task = encodeImage(new File(['x'], 'a.png'), CompressEncoderEnum.webP, controller.signal)
    const worker = WorkerFixture.instance
    if (!worker)
      throw new Error('Worker not created')
    const expected = mode === 'success' ? expect(task).resolves.toMatchObject({ type: 'image/webp' }) : expect(task).rejects.toBeDefined()
    if (mode === 'abort')
      controller.abort()
    else if (mode === 'success')
      worker.dispatchEvent(new MessageEvent('message', { data: { id, ok: true, buffer: new ArrayBuffer(1), mimeType: 'image/webp', extension: 'webp' } }))
    else if (mode !== 'post-error')
      worker.dispatchEvent(new Event(mode))
    await expected
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })
})
