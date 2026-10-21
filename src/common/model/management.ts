import type { UploadedImageModel } from '@/common/model/image'
import type { ApiFailure } from '@/utils/request/types'

export interface ManagementOperation {
  kind: 'delete' | 'rename' | 'move' | 'copy' | 'upload'
  media?: readonly Pick<UploadedImageModel, 'path' | 'sha'>[]
  directory?: string
}

export type ManagementMediaAction = 'copy' | 'property' | 'rename' | 'move' | 'delete' | 'repository'

export type ManagementDirectoryAction = 'open' | 'upload' | 'rename' | 'delete' | 'repository'

export interface ManagementBatchResult {
  successes: string[]
  failures: Array<{ path: string, sha: string, error: ApiFailure }>
  cacheFailed: boolean
}
