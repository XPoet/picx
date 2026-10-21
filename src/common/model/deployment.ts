import type { RepositoryIdentity } from './github-connection'
import type { ApiFailure } from '@/utils/request/types'

export type DeploymentState
  = | { phase: 'idle' }
    | { phase: 'checking', operationId: number, target: RepositoryIdentity }
    | { phase: 'not-deployed', target: RepositoryIdentity, checkedAt: number }
    | { phase: 'submitting', operationId: number, target: RepositoryIdentity, step: 'cname' | 'branch' | 'pages' }
    | { phase: 'waiting', operationId: number, target: RepositoryIdentity, commitSha: string }
    | { phase: 'available', operationId: number, target: RepositoryIdentity, commitSha: string, url: string, deployedAt?: string, checkedAt: number, evidence: 'pages-build' }
    | { phase: 'failed', operationId: number, target: RepositoryIdentity, error: ApiFailure }

export type DeploymentObservation
  = | { phase: 'not-deployed' }
    | { phase: 'waiting', commitSha: string }
    | { phase: 'available', commitSha: string, url: string, deployedAt?: string }

export interface DeploymentRequest {
  domain?: string
  saveDomain?: boolean
}
