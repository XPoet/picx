import type { GitTreeEntry, GitTreeObjectInfo } from './git-tree'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import { requestResult } from '@/utils/request'

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object'
const sha = (value: unknown): value is { sha: string } => record(value) && typeof value.sha === 'string' && Boolean(value.sha)
const prefix = (target: RepositoryIdentity) => `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

export function deleteManagementFileResult(target: RepositoryIdentity, path: string, expectedSha: string) {
  return requestResult({ url: `${prefix(target)}/contents/${encodePath(path)}`, method: 'DELETE', data: { message: 'Delete media with PicX', sha: expectedSha, branch: target.branch } }, (value): value is { commit: { sha: string } } => record(value) && sha(value.commit))
}

export function managementEntryResult(target: RepositoryIdentity, path: string) {
  return requestResult({ url: `${prefix(target)}/contents/${encodePath(path)}`, method: 'GET', noCache: true, params: { ref: target.branch } }, (value): value is { path: string, sha: string, type: string } | unknown[] => Array.isArray(value) || (record(value) && typeof value.path === 'string' && typeof value.type === 'string' && sha(value)))
}

export function managementTreeResult(target: RepositoryIdentity, treeSha: string) {
  return requestResult({ url: `${prefix(target)}/git/trees/${encodeURIComponent(treeSha)}`, method: 'GET', noCache: true, params: { recursive: '1' } }, (value): value is GitTreeObjectInfo => record(value) && typeof value.truncated === 'boolean' && Array.isArray(value.tree) && value.tree.every((item: unknown) => record(item) && typeof item.path === 'string' && typeof item.mode === 'string' && typeof item.type === 'string' && sha(item)) && sha(value))
}

export function managementCommitTreeResult(target: RepositoryIdentity, entries: GitTreeEntry[], baseTree: string) {
  return requestResult({ url: `${prefix(target)}/git/trees`, method: 'POST', data: { base_tree: baseTree, tree: entries.map(entry => ({ mode: '100644', type: 'blob', ...entry })) } }, sha)
}

export function managementCommitResult(target: RepositoryIdentity, treeSha: string, parent: string, message: string) {
  return requestResult({ url: `${prefix(target)}/git/commits`, method: 'POST', data: { tree: treeSha, parents: [parent], message } }, sha)
}
