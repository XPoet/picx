import type { UploadedImageModel, UserSettingsModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiFailure } from '@/utils/request/types'

export interface UploadTargetSnapshot extends RepositoryIdentity {
  readonly dir: string
  readonly resolvedAt: number
}
export interface ProcessingSnapshot {
  readonly revision: number
  readonly imageName: Readonly<UserSettingsModel['imageName']>
  readonly compress: Readonly<UserSettingsModel['compress']>
  readonly watermark: Readonly<UserSettingsModel['watermark']>
}
export interface UploadItemSuccess {
  uuid: string
  target: UploadTargetSnapshot
  image: UploadedImageModel
  commitSha: string
  uploadedBytes: number
  recovered?: boolean
}
export interface UploadItemFailure {
  uuid: string
  target: UploadTargetSnapshot
  stage: 'blob' | 'head' | 'tree' | 'commit' | 'ref' | 'contents'
  error: ApiFailure
}
export type QueueItemRuntime = {
  uuid: string
  generation: number
  settings: ProcessingSnapshot
} & (
  | { phase: 'processing', step: 'watermark' | 'compress' }
  | { phase: 'ready', finalBytes: number, skippedProcessing: boolean }
  | { phase: 'uploading', batchId: string, stage: UploadItemFailure['stage'] }
  | { phase: 'uploaded', result: UploadItemSuccess }
  | { phase: 'failed', source: 'processing', reason: 'decode' | 'watermark' | 'encode' }
  | { phase: 'failed', source: 'upload', result: UploadItemFailure }
)
export interface UploadBatchResult {
  batchId: string
  target: UploadTargetSnapshot
  attemptedUuids: readonly string[]
  successes: UploadItemSuccess[]
  failures: UploadItemFailure[]
  cacheFailed?: boolean
}
