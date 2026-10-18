import type { ApiFailure } from '@/utils/request/types'

export type ManagementMediaAction = 'copy' | 'property' | 'rename' | 'move' | 'delete' | 'repository'

export type ManagementDirectoryAction = 'open' | 'upload' | 'rename' | 'delete' | 'repository'

export interface ManagementBatchResult {
  successes: string[]
  failures: Array<{ path: string, sha: string, error: ApiFailure }>
  cacheFailed: boolean
}
