import type { ApiFailure } from '@/utils/request/types'

export interface RepositoryIdentity {
  readonly owner: string
  readonly repo: string
  readonly branch: string
}

export type ConnectionFailure = ApiFailure | {
  kind: 'app-not-installed' | 'initialization-failed' | 'storage-unavailable'
  retryable: boolean
}

export type ConnectionState
  = | { phase: 'disconnected' }
    | { phase: 'validating', attemptId: number }
    | { phase: 'initializing', attemptId: number, step: 'user' | 'repository' | 'branch' }
    | {
      phase: 'connected'
      attemptId: number
      repository: RepositoryIdentity
      visibility: 'public' | 'private'
      verifiedAt: number
    }
    | { phase: 'failed', attemptId: number, error: ConnectionFailure }

export interface GitHubAccount {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export interface ConnectedRepository {
  account: GitHubAccount
  repository: RepositoryIdentity
  visibility: 'public' | 'private'
  reuseDirectory: boolean
}

export type ConnectionResult
  = | { ok: true, data: ConnectedRepository }
    | { ok: false, error: ConnectionFailure }
