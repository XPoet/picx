import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiResult } from '@/utils/request/types'
import { PICX_DEL_CNAME_MSG, PICX_INIT_CNAME_MSG, PICX_UPDATE_CNAME_MSG } from '@/common/constant'
import { requestResult } from '@/utils/request'

export enum CloudCnameSyncStatusEnum {
  created = 'created',
  updated = 'updated',
  deleted = 'deleted',
  consistent = 'consistent',
  skipped = 'skipped',
  failed = 'failed',
}
export const normalizeCustomDomain = (domain: string): string => domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()
export const isValidCustomDomain = (domain: string): boolean => domain.length <= 253 && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)
interface CnameFile { sha: string, content: string }
export type CloudCnameRead = { kind: 'missing' } | { kind: 'present', file: CnameFile, domain: string }
function isCnameFile(value: unknown): value is CnameFile {
  return Boolean(value && typeof value === 'object' && 'sha' in value && typeof value.sha === 'string' && value.sha && 'content' in value && typeof value.content === 'string')
}
export async function getCloudCnameFile(target: RepositoryIdentity, branch = target.branch): Promise<ApiResult<CloudCnameRead>> {
  const result = await requestResult({ url: `/repos/${target.owner}/${target.repo}/contents/CNAME`, method: 'GET', params: { ref: branch }, noCache: true }, isCnameFile)
  if (!result.ok)
    return result.error.kind === 'not-found' ? { ok: true, data: { kind: 'missing' } } : result
  try {
    const domain = window.atob(result.data.content).trim().toLowerCase()
    return isValidCustomDomain(domain) ? { ok: true, data: { kind: 'present', file: result.data, domain } } : { ok: false, error: { kind: 'invalid-response', retryable: true } }
  }
  catch { return { ok: false, error: { kind: 'invalid-response', retryable: true } } }
}
interface CnameSyncOptions {
  allowDelete?: boolean
  expectedSha?: string
  current?: () => boolean
}
function contentWritten(value: unknown): value is { commit: { sha: string } } {
  return Boolean(value && typeof value === 'object' && 'commit' in value && value.commit && typeof value.commit === 'object' && 'sha' in value.commit && typeof value.commit.sha === 'string')
}
export async function syncCloudCnameFileResult(target: RepositoryIdentity, domain: string, branch = target.branch, options: CnameSyncOptions = {}): Promise<ApiResult<{ status: CloudCnameSyncStatusEnum }>> {
  const normalized = normalizeCustomDomain(domain)
  if (!target.owner || !target.repo || !branch || (normalized && !isValidCustomDomain(normalized)))
    return { ok: false, error: { kind: 'invalid-response', retryable: false } }
  const read = await getCloudCnameFile(target, branch)
  if (!read.ok)
    return read
  if (options.current && !options.current())
    return { ok: false, error: { kind: 'conflict', retryable: true } }
  const existing = read.data.kind === 'present' ? read.data : null
  if (!normalized && !existing)
    return { ok: true, data: { status: CloudCnameSyncStatusEnum.skipped } }
  if (existing?.domain === normalized)
    return { ok: true, data: { status: CloudCnameSyncStatusEnum.consistent } }
  if (!normalized && existing && (!options.allowDelete || (options.expectedSha !== undefined && options.expectedSha !== existing.file.sha)))
    return { ok: false, error: { kind: 'conflict', retryable: true } }
  const result = await requestResult({
    url: `/repos/${target.owner}/${target.repo}/contents/CNAME`,
    method: normalized ? 'PUT' : 'DELETE',
    data: { message: normalized ? existing ? PICX_UPDATE_CNAME_MSG : PICX_INIT_CNAME_MSG : PICX_DEL_CNAME_MSG, branch, ...(normalized ? { content: window.btoa(normalized) } : {}), ...(existing ? { sha: existing.file.sha } : {}) },
  }, contentWritten)
  return result.ok ? { ok: true, data: { status: normalized ? existing ? CloudCnameSyncStatusEnum.updated : CloudCnameSyncStatusEnum.created : CloudCnameSyncStatusEnum.deleted } } : result
}
/** 兼容旧结果枚举；未经确认默认不允许删除。 */
export async function syncCloudCnameFile(target: RepositoryIdentity, domain: string, branch: string): Promise<CloudCnameSyncStatusEnum> {
  const result = await syncCloudCnameFileResult(target, domain, branch)
  return result.ok ? result.data.status : CloudCnameSyncStatusEnum.failed
}
