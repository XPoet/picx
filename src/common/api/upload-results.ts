import type { RepositoryIdentity } from '@/common/model/github-connection'
import { PICX_UPLOAD_IMG_DESC } from '@/common/constant'
import { requestResult } from '@/utils/request'

interface ShaResult { sha: string }
export interface UploadHead { commit: { sha: string, commit: { tree: ShaResult } } }
export interface UploadContent { name: string, sha: string, path: string, size: number }
export interface ContentsCommit { content: UploadContent, commit: ShaResult }
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
function sha(value: unknown): value is ShaResult {
  return record(value) && typeof value.sha === 'string' && !!value.sha
}
function content(value: unknown): value is UploadContent {
  return record(value) && typeof value.name === 'string' && typeof value.path === 'string' && sha(value) && typeof value.size === 'number' && Number.isFinite(value.size) && value.size >= 0
}
function head(value: unknown): value is UploadHead {
  return record(value) && record(value.commit) && sha(value.commit) && record(value.commit.commit) && sha(value.commit.commit.tree)
}
const prefix = (target: RepositoryIdentity) => `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`
const contentPath = (target: RepositoryIdentity, path: string) => `${prefix(target)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
export function uploadBlobResult(target: RepositoryIdentity, base64: string, signal?: AbortSignal) {
  return requestResult({ signal, url: `${prefix(target)}/git/blobs`, method: 'POST', data: { content: base64, encoding: 'base64' } }, sha)
}
export function uploadHeadResult(target: RepositoryIdentity, signal?: AbortSignal) {
  return requestResult({ signal, url: `${prefix(target)}/branches/${encodeURIComponent(target.branch)}`, method: 'GET', noCache: true }, head)
}
export function uploadTreeResult(target: RepositoryIdentity, files: { path: string, sha: string }[], current: UploadHead, signal?: AbortSignal) {
  return requestResult({ signal, url: `${prefix(target)}/git/trees`, method: 'POST', data: { base_tree: current.commit.commit.tree.sha, tree: files.map(file => ({ ...file, mode: '100644', type: 'blob' })) } }, sha)
}
export function uploadCommitResult(target: RepositoryIdentity, tree: ShaResult, current: UploadHead, signal?: AbortSignal) {
  return requestResult({ signal, url: `${prefix(target)}/git/commits`, method: 'POST', data: { message: PICX_UPLOAD_IMG_DESC, tree: tree.sha, parents: [current.commit.sha] } }, sha)
}
export function uploadRefResult(target: RepositoryIdentity, commitSha: string, signal?: AbortSignal) {
  return requestResult({ signal, url: `${prefix(target)}/git/refs/heads/${encodeURIComponent(target.branch)}`, method: 'PATCH', data: { sha: commitSha, force: false } }, (value): value is { object: ShaResult } => record(value) && sha(value.object) && value.object.sha === commitSha)
}
export function uploadContentsResult(target: RepositoryIdentity, path: string, base64: string, committer?: { name: string, email: string }, signal?: AbortSignal) {
  return requestResult({ signal, url: contentPath(target, path), method: 'PUT', data: { message: PICX_UPLOAD_IMG_DESC, branch: target.branch, content: base64, ...(committer ? { committer } : {}) } }, (value): value is ContentsCommit => record(value) && content(value.content) && sha(value.commit))
}
export function uploadContentResult(target: RepositoryIdentity, path: string, signal?: AbortSignal) {
  return requestResult({ signal, url: contentPath(target, path), method: 'GET', noCache: true, params: { ref: target.branch } }, content)
}
