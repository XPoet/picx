import type { ImageHandleResult, UploadImageModel } from '@/common/model'
import type { ProcessingSnapshot } from '@/common/model/upload'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { ImageProcessingError, processImage } from '@/services/image-processing'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { directoryDraft, validateDirectoryDraft } from '@/utils/directory-utils'
import { copyLinkText, successLinkText } from '@/utils/image-link-utils'
import { applyUploadNaming, createNamedUploadImage, finalUploadFile } from '@/utils/upload-naming'
import { uploadFilesToGitHub } from '@/utils/upload-utils'

export function useUploadWorkspace(process = processImage) {
  const store = usePicxStore(pinia)
  const queue = computed(() => store.getUploadImageList)
  const settings = computed(() => store.getUserSettings)
  const runtime = computed(() => store.uploadRuntime)
  const jobs = new Map<string, { controller: AbortController, signature: string }>()
  const signatures = new Map<string, string>()
  let generation = 0
  let disposed = false
  let ownsUpload = false
  const online = ref(navigator.onLine !== false)
  const actionError = ref<'storage-unavailable' | null>(null)
  const attemptedTotal = ref(0)
  const initialSuccesses = ref(0)
  const updateOnline = () => online.value = navigator.onLine !== false
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)

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
        applyUploadNaming(item, settings.value.imageName)
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
  const stopNaming = watch([() => queue.value.map(item => item.uuid).join('|'), () => JSON.stringify(settings.value.imageName), () => store.uploadTargetBusy], () => {
    if (!store.uploadTargetBusy)
      queue.value.forEach(item => applyUploadNaming(item, settings.value.imageName))
  }, { immediate: true })
  function retryProcessing(uuid: string) {
    signatures.delete(uuid)
    reconcile()
  }
  onScopeDispose(() => {
    disposed = true
    window.removeEventListener('online', updateOnline)
    window.removeEventListener('offline', updateOnline)
    if (ownsUpload) {
      ownsUpload = false
      store.uploadTargetBusy = false
    }
    stop()
    stopNaming()
    for (const uuid of jobs.keys()) {
      cancel(uuid)
      delete runtime.value[uuid]
      const item = queue.value.find(item => item.uuid === uuid)
      if (item)
        Object.assign(item.beforeUploadStatus, { watermarking: false, compressing: false })
    }
  })
  function updateName(uuid: string, override: NonNullable<UploadImageModel['namingOverrides']>) {
    const item = queue.value.find(item => item.uuid === uuid)
    if (!item || item.uploadStatus.progress === 100 || store.uploadTargetBusy)
      return
    item.namingOverrides = { ...item.namingOverrides, ...override }
    applyUploadNaming(item, settings.value.imageName)
  }
  const processing = computed(() => queue.value.some(item => runtime.value[item.uuid]?.phase === 'processing'))
  const ready = computed(() => queue.value.filter((item) => {
    const state = runtime.value[item.uuid]
    return item.uploadStatus.progress === 0 && (state?.phase === 'ready' || (state?.phase === 'failed' && state.source === 'upload'))
  }))
  const pending = computed(() => queue.value.filter(item => item.uploadStatus.progress === 0))
  const successes = computed(() => queue.value.flatMap((item) => {
    const state = runtime.value[item.uuid]
    return state?.phase === 'uploaded' ? [state.result] : []
  }))
  const connected = computed(() => {
    const config = store.getUserConfigInfo
    const connection = store.connection
    return !!config.token && connection.phase === 'connected' && connection.repository.owner === config.owner && connection.repository.repo === config.repo && connection.repository.branch === config.branch
  })
  const uploading = computed(() => store.uploadTargetBusy)
  const canUpload = computed(() => !uploading.value && !processing.value && online.value && connected.value && !!store.getUserConfigInfo.selectedDir && ready.value.length > 0)
  const pendingBytes = computed(() => {
    if (pending.value.some(item => runtime.value[item.uuid]?.phase === 'processing' || !finalUploadFile(item) || (runtime.value[item.uuid]?.phase === 'failed' && !ready.value.includes(item))))
      return null
    return pending.value.reduce((total, item) => total + (finalUploadFile(item)?.size ?? 0), 0)
  })
  const lastBatch = computed(() => store.uploadBatches.at(-1) ?? null)
  const completed = computed(() => Math.max(0, successes.value.length - initialSuccesses.value))
  function addFiles(files: ImageHandleResult[]) {
    if (!uploading.value)
      files.forEach(file => store.UPLOAD_IMG_LIST_ADD(createNamedUploadImage(file, settings.value.imageName)))
  }
  function remove(uuid: string) {
    if (!uploading.value)
      store.UPLOAD_IMG_LIST_REMOVE(uuid)
  }
  function reset() {
    if (uploading.value)
      return
    store.UPLOAD_IMG_LIST_RESET()
    actionError.value = null
    attemptedTotal.value = 0
  }
  function setCompress(enable: boolean) {
    if (!uploading.value)
      store.SET_USER_SETTINGS({ compress: { ...settings.value.compress, enable } })
  }
  function setWatermark(enable: boolean) {
    if (!uploading.value)
      store.SET_USER_SETTINGS({ watermark: { ...settings.value.watermark, enable } })
  }
  function setFormat(value: string) {
    if (!uploading.value)
      store.SET_USER_SETTINGS({ imageLinkFormat: { ...settings.value.imageLinkFormat, enable: value !== 'raw', selected: value === 'raw' ? settings.value.imageLinkFormat.selected : value } })
  }
  const copyAll = () => copyLinkText(successLinkText(successes.value, settings.value))
  async function upload() {
    reconcile()
    if (!canUpload.value || disposed)
      return null
    const config = store.getUserConfigInfo
    const now = new Date()
    const value = validateDirectoryDraft(directoryDraft(config), now)
    if (!value.ok || !store.SAVE_UPLOAD_DIRECTORY(value.value).ok) {
      actionError.value = 'storage-unavailable'
      return null
    }
    const attempt = store.connectionAttemptId
    const identity = [config.owner, config.repo, config.branch].join('/')
    const current = () => !disposed && store.connectionAttemptId === attempt && [store.getUserConfigInfo.owner, store.getUserConfigInfo.repo, store.getUserConfigInfo.branch].join('/') === identity
    attemptedTotal.value = ready.value.length
    initialSuccesses.value = successes.value.length
    const files = [...ready.value]
    actionError.value = null
    store.uploadTargetBusy = true
    ownsUpload = true
    try {
      const result = await uploadFilesToGitHub({ ...config }, files, { now, isCurrent: current })
      if (current()) {
        store.uploadBatches.push(result)
        if (result.successes.length)
          void copyLinkText(successLinkText(result.successes, settings.value), true)
      }
      return result
    }
    finally {
      if (ownsUpload) {
        ownsUpload = false
        store.uploadTargetBusy = false
      }
    }
  }
  return { queue, settings, runtime, processing, ready, pending, pendingBytes, successes, connected, uploading, online, actionError, lastBatch, attemptedTotal, completed, canUpload, addFiles, remove, reset, upload, copyAll, setCompress, setWatermark, setFormat, retryProcessing, updateName }
}
