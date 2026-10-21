import type { UploadImageModel, UserConfigInfoModel } from '@/common/model'
import type { UploadBatchResult, UploadItemFailure, UploadItemSuccess, UploadTargetSnapshot } from '@/common/model/upload'
import type { ApiFailure } from '@/utils/request/types'
import {
  uploadBlobResult,
  uploadCommitResult,
  uploadContentResult,
  uploadContentsResult,
  uploadHeadResult,
  uploadRefResult,
  uploadTreeResult,
} from '@/common/api/upload-results'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { resolveUploadTarget } from '@/utils/directory-utils'
import { isVideo } from '@/utils/file-utils'
import { purgeImageRuntimeCache } from '@/utils/image-cache-utils'
import { finalUploadFile } from '@/utils/upload-naming'

interface FrozenUpload {
  item: UploadImageModel
  name: string
  path: string
  content: string
  bytes: number | undefined
  target: UploadTargetSnapshot
}
interface UnconfirmedUpload { path: string, content: string, target: UploadTargetSnapshot, sha?: string }
const inFlight = new WeakSet<UploadImageModel>()
const unconfirmed = new WeakMap<UploadImageModel, UnconfirmedUpload>()
const invalid: ApiFailure = { kind: 'invalid-response', retryable: true }
const conflict: ApiFailure = { kind: 'conflict', retryable: false }
const stale: ApiFailure = { kind: 'service', retryable: false }
const itemPath = (directory: string, name: string) => directory === '/' ? name : `${directory}/${name}`

/** 兼容管理重命名入口，路径严格从其独立的重传目标获取。 */
export function uploadUrlHandle(config: UserConfigInfoModel, image: UploadImageModel): string {
  const path = image.reUploadInfo?.isReUpload ? image.reUploadInfo.path : itemPath(config.selectedDir, image.filename.final)
  return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
}
async function blobSha(base64: string) {
  const binary = atob(base64)
  const prefix = new TextEncoder().encode(`blob ${binary.length}\0`)
  const bytes = new Uint8Array(prefix.length + binary.length)
  bytes.set(prefix)
  for (let index = 0; index < binary.length; index++)
    bytes[prefix.length + index] = binary.charCodeAt(index)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
export interface UploadExecutionOptions {
  now?: Date
  signal?: AbortSignal
  isCurrent?: () => boolean
  onStage?: (uuid: string, stage: UploadItemFailure['stage']) => void
}

/** 每个尝试项只出现于一个结果集；提交确认前不发布成功与缓存。 */
export async function uploadFilesToGitHub(config: UserConfigInfoModel, images: UploadImageModel[], options: UploadExecutionOptions = {}): Promise<UploadBatchResult> {
  const baseTarget = resolveUploadTarget(config, options.now ?? new Date())
  const items = images.filter(item => item.uploadStatus.progress === 0 && !item.uploadStatus.uploading && !inFlight.has(item))
  const files: FrozenUpload[] = items.map((item) => {
    const target = item.reUploadInfo?.isReUpload ? Object.freeze({ ...baseTarget, dir: item.reUploadInfo.dir }) : baseTarget
    return Object.freeze({ item, target, name: item.filename.final, path: item.reUploadInfo?.isReUpload ? item.reUploadInfo.path : itemPath(target.dir, item.filename.final), content: (item.base64.compressBase64 || item.base64.watermarkBase64 || item.base64.originalBase64).split(',')[1] ?? '', bytes: finalUploadFile(item)?.size })
  })
  const batch: UploadBatchResult = { batchId: crypto.randomUUID(), target: files[0]?.target ?? baseTarget, attemptedUuids: files.map(file => file.item.uuid), successes: [], failures: [] }
  const store = usePicxStore(pinia)
  const current = () => options.isCurrent?.() !== false && !options.signal?.aborted
  function stage(file: FrozenUpload, stage: UploadItemFailure['stage']) {
    if (!current())
      return
    file.item.uploadStatus.uploading = stage === 'blob' || stage === 'contents'
    const state = store.uploadRuntime[file.item.uuid]
    if (state)
      store.uploadRuntime[file.item.uuid] = { ...state, phase: 'uploading', batchId: batch.batchId, stage }
    options.onStage?.(file.item.uuid, stage)
  }
  function fail(file: FrozenUpload, stage: UploadItemFailure['stage'], error: ApiFailure) {
    file.item.uploadStatus.uploading = false
    const failure: UploadItemFailure = { uuid: file.item.uuid, target: file.target, stage, error }
    batch.failures.push(failure)
    const state = store.uploadRuntime[file.item.uuid]
    if (current() && state)
      store.uploadRuntime[file.item.uuid] = { ...state, phase: 'failed', source: 'upload', result: failure }
  }
  function succeed(file: FrozenUpload, sha: string, commitSha: string, bytes: number, recovered = false) {
    file.item.uploadStatus.uploading = false
    const image = { checked: false, type: isVideo(file.name) ? 'video' : 'image', uuid: file.item.uuid, dir: file.target.dir, name: file.name, sha, path: file.path, deleting: false, size: bytes, deployed: true, uploadTime: Date.now() }
    const success: UploadItemSuccess = { uuid: file.item.uuid, target: file.target, image, commitSha, uploadedBytes: bytes, ...(recovered ? { recovered } : {}) }
    batch.successes.push(success)
    if (!current()) {
      unconfirmed.set(file.item, { path: file.path, content: file.content, target: file.target, sha })
      return
    }
    unconfirmed.delete(file.item)
    file.item.uploadStatus.progress = 100
    file.item.uploadedImg = image
    const state = store.uploadRuntime[file.item.uuid]
    if (state)
      store.uploadRuntime[file.item.uuid] = { ...state, phase: 'uploaded', result: success }
    try {
      store.DIR_IMAGE_LIST_ADD_DIR(file.target.dir)
      store.DIR_IMAGE_LIST_ADD_IMAGE(image)
      purgeImageRuntimeCache([file.path])
    }
    catch {
      batch.cacheFailed = true
    }
  }
  files.forEach((file) => {
    inFlight.add(file.item)
  })
  let activeStage: UploadItemFailure['stage'] = files.length === 1 ? 'contents' : 'blob'
  try {
    const pending: FrozenUpload[] = []
    for (const file of files) {
      if (!current()) {
        fail(file, activeStage, stale)
        continue
      }
      const previous = unconfirmed.get(file.item)
      if (previous && previous.path === file.path && previous.content === file.content && previous.target.owner === file.target.owner && previous.target.repo === file.target.repo && previous.target.branch === file.target.branch) {
        stage(file, 'contents')
        const found = await uploadContentResult(file.target, file.path, options.signal)
        if (found.ok) {
          const expectedSha = previous.sha ?? await blobSha(file.content)
          if (found.data.path !== file.path || found.data.sha !== expectedSha) {
            fail(file, 'contents', conflict)
            continue
          }
          const head = await uploadHeadResult(file.target, options.signal)
          if (!head.ok) {
            fail(file, 'head', head.error)
            continue
          }
          succeed(file, found.data.sha, head.data.commit.sha, file.bytes ?? found.data.size, true)
          continue
        }
        if (found.error.kind !== 'not-found') {
          fail(file, 'contents', found.error)
          continue
        }
        unconfirmed.delete(file.item)
      }
      pending.push(file)
    }
    if (!pending.length)
      return batch
    if (pending.length === 1 && files.length === 1) {
      const file = pending[0]
      stage(file, 'contents')
      const result = await uploadContentsResult(file.target, file.path, file.content, config.email ? { name: config.owner, email: config.email } : undefined, options.signal)
      if (!result.ok) {
        unconfirmed.set(file.item, { ...file })
        fail(file, 'contents', result.error)
      }
      else if (result.data.content.path !== file.path || (file.bytes !== undefined && result.data.content.size !== file.bytes)) {
        unconfirmed.set(file.item, { ...file })
        fail(file, 'contents', invalid)
      }
      else {
        succeed(file, result.data.content.sha, result.data.commit.sha, file.bytes ?? result.data.content.size)
      }
      return batch
    }
    const blobs: { file: FrozenUpload, sha: string }[] = []
    for (const file of pending) {
      if (!current()) {
        fail(file, 'blob', stale)
        continue
      }
      if (pending.some(other => other !== file && other.path === file.path) || file.target.dir !== batch.target.dir) {
        fail(file, 'blob', conflict)
        continue
      }
      stage(file, 'blob')
      const blob = await uploadBlobResult(file.target, file.content, options.signal)
      file.item.uploadStatus.uploading = false
      if (!blob.ok)
        fail(file, 'blob', blob.error)
      else blobs.push({ file, sha: blob.data.sha })
    }
    if (!blobs.length)
      return batch
    activeStage = 'head'
    blobs.forEach(({ file }) => stage(file, activeStage))
    if (!current()) {
      blobs.forEach(({ file }) => fail(file, activeStage, stale))
      return batch
    }
    const head = await uploadHeadResult(batch.target, options.signal)
    if (!head.ok) {
      blobs.forEach(({ file }) => fail(file, 'head', head.error))
      return batch
    }
    activeStage = 'tree'
    blobs.forEach(({ file }) => stage(file, activeStage))
    if (!current()) {
      blobs.forEach(({ file }) => fail(file, activeStage, stale))
      return batch
    }
    const tree = await uploadTreeResult(batch.target, blobs.map(({ file, sha }) => ({ path: file.path, sha })), head.data, options.signal)
    if (!tree.ok) {
      blobs.forEach(({ file }) => fail(file, 'tree', tree.error))
      return batch
    }
    activeStage = 'commit'
    blobs.forEach(({ file }) => stage(file, activeStage))
    if (!current()) {
      blobs.forEach(({ file }) => fail(file, activeStage, stale))
      return batch
    }
    const commit = await uploadCommitResult(batch.target, tree.data, head.data, options.signal)
    if (!commit.ok) {
      blobs.forEach(({ file }) => fail(file, 'commit', commit.error))
      return batch
    }
    activeStage = 'ref'
    blobs.forEach(({ file }) => stage(file, activeStage))
    if (!current()) {
      blobs.forEach(({ file }) => fail(file, activeStage, stale))
      return batch
    }
    const ref = await uploadRefResult(batch.target, commit.data.sha, options.signal)
    if (!ref.ok) {
      blobs.forEach(({ file, sha }) => {
        unconfirmed.set(file.item, { ...file, sha })
        fail(file, 'ref', ref.error)
      })
      return batch
    }
    blobs.forEach(({ file, sha }) => succeed(file, sha, commit.data.sha, file.bytes ?? atob(file.content).length))
    return batch
  }
  catch {
    const settled = new Set([...batch.successes, ...batch.failures].map(result => result.uuid))
    files.filter(file => !settled.has(file.item.uuid)).forEach(file => fail(file, activeStage, invalid))
    return batch
  }
  finally {
    files.forEach((file) => {
      file.item.uploadStatus.uploading = false
      inFlight.delete(file.item)
    })
  }
}

/** 旧管理重命名调用保留布尔契约。 */
export async function uploadImageToGitHub(config: UserConfigInfoModel, image: UploadImageModel): Promise<boolean> {
  const result = await uploadFilesToGitHub(config, [image])
  return result.successes.length === 1 && result.failures.length === 0
}
/** 旧批量调用只有每个尝试项成功才为 true。 */
export async function uploadImagesToGitHub(config: UserConfigInfoModel, images: UploadImageModel[]): Promise<boolean> {
  const result = await uploadFilesToGitHub(config, images)
  return result.attemptedUuids.length > 0 && result.successes.length === result.attemptedUuids.length && result.failures.length === 0
}
