import type { ProcessingSnapshot } from '@/common/model/upload'
import { computed, onScopeDispose, watch } from 'vue'
import { ImageProcessingError, processImage } from '@/services/image-processing'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { getFileSuffix } from '@/utils/file-utils'

export function useUploadWorkspace(process = processImage) {
  const store = usePicxStore(pinia)
  const queue = computed(() => store.getUploadImageList)
  const settings = computed(() => store.getUserSettings)
  const runtime = computed(() => store.uploadRuntime)
  const jobs = new Map<string, { controller: AbortController, signature: string }>()
  const signatures = new Map<string, string>()
  let generation = 0
  let disposed = false

  function snapshot(): ProcessingSnapshot {
    const current = settings.value
    return {
      revision: ++generation,
      imageName: { ...current.imageName, addPrefix: { ...current.imageName.addPrefix } },
      compress: { ...current.compress },
      watermark: { ...current.watermark },
    }
  }
  function cancel(uuid: string) {
    jobs.get(uuid)?.controller.abort()
    jobs.delete(uuid)
    signatures.delete(uuid)
  }
  function reconcile() {
    for (const uuid of Object.keys(runtime.value)) {
      if (!queue.value.some(item => item.uuid === uuid)) {
        cancel(uuid)
        delete runtime.value[uuid]
      }
    }
    if (store.uploadTargetBusy || disposed)
      return
    const signature = JSON.stringify([settings.value.watermark, settings.value.compress])
    for (const item of queue.value) {
      if (item.uploadStatus.progress === 100 || item.uploadStatus.uploading || signatures.get(item.uuid) === signature)
        continue
      cancel(item.uuid)
      const original = item.fileInfo.originalFile
      if (!original)
        continue
      const current = snapshot()
      const controller = new AbortController()
      jobs.set(item.uuid, { controller, signature })
      signatures.set(item.uuid, signature)
      const base = { uuid: item.uuid, generation: current.revision, settings: current }
      const active = () => !disposed && !controller.signal.aborted && queue.value.includes(item) && runtime.value[item.uuid]?.generation === current.revision
      Object.assign(item.beforeUploadStatus, { watermarking: false, compressing: false })
      item.fileInfo.watermarkFile = null
      item.fileInfo.compressFile = null
      item.base64.watermarkBase64 = null
      item.base64.compressBase64 = null
      runtime.value[item.uuid] = { ...base, phase: 'processing', step: 'watermark' }
      void process(original, current, controller.signal, (step) => {
        if (!active())
          return
        item.beforeUploadStatus.watermarking = step === 'watermark'
        item.beforeUploadStatus.compressing = step === 'compress'
        runtime.value[item.uuid] = { ...base, phase: 'processing', step }
      }).then((result) => {
        if (!active())
          return
        Object.assign(item.fileInfo, { watermarkFile: result.watermarkFile, compressFile: result.compressFile })
        Object.assign(item.base64, { watermarkBase64: result.watermarkBase64, compressBase64: result.compressBase64 })
        item.filename.suffix = getFileSuffix(result.finalFile.name)
        item.filename.final = `${item.filename.name}${item.filename.isAddHash ? `.${item.filename.hash}` : ''}.${item.filename.suffix}`
        runtime.value[item.uuid] = { ...base, phase: 'ready', finalBytes: result.finalFile.size, skippedProcessing: result.skippedProcessing }
      }).catch((error: unknown) => {
        if (active())
          runtime.value[item.uuid] = { ...base, phase: 'failed', source: 'processing', reason: error instanceof ImageProcessingError ? error.reason : 'decode' }
      }).finally(() => {
        if (active()) {
          item.beforeUploadStatus.watermarking = false
          item.beforeUploadStatus.compressing = false
          jobs.delete(item.uuid)
        }
      })
    }
  }
  const stop = watch([() => queue.value.map(item => item.uuid).join('|'), () => JSON.stringify([settings.value.watermark, settings.value.compress]), () => store.uploadTargetBusy], reconcile, { immediate: true })
  function retryProcessing(uuid: string) {
    signatures.delete(uuid)
    reconcile()
  }
  onScopeDispose(() => {
    disposed = true
    stop()
    for (const uuid of jobs.keys()) {
      cancel(uuid)
      delete runtime.value[uuid]
      const item = queue.value.find(item => item.uuid === uuid)
      if (item)
        Object.assign(item.beforeUploadStatus, { watermarking: false, compressing: false })
    }
  })
  const processing = computed(() => queue.value.some(item => runtime.value[item.uuid]?.phase === 'processing'))
  const ready = computed(() => queue.value.filter(item => item.uploadStatus.progress === 0 && runtime.value[item.uuid]?.phase === 'ready'))
  return { queue, runtime, processing, ready, retryProcessing }
}
