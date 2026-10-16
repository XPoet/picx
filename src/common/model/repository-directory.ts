import type { ApiFailure } from '@/utils/request/types'

export interface RepositoryDirectoryOption {
  name: string
  segments: readonly string[]
  leaf: boolean
}

export type DirectoryQueryState
  = | { phase: 'idle' }
    | { phase: 'loading', requestId: number, items?: readonly RepositoryDirectoryOption[] }
    | { phase: 'loaded', items: readonly RepositoryDirectoryOption[] }
    | { phase: 'failed', error: ApiFailure, items?: readonly RepositoryDirectoryOption[] }
