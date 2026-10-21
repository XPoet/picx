import type { DeploymentObservation } from '@/common/model/deployment'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiResult } from '@/utils/request/types'
import { GH_PAGES } from '@/common/constant'
import { requestResult } from '@/utils/request'
import { getGitReference } from './branch'

interface PagesInfo {
  status: string | null
  html_url: string
  cname?: string | null
  source?: { branch: string, path: string }
}
interface PagesBuild { status: string, commit: string, updated_at?: string }
function isPagesInfo(value: unknown): value is PagesInfo {
  if (!value || typeof value !== 'object' || !('html_url' in value) || typeof value.html_url !== 'string' || !('status' in value) || (value.status !== null && typeof value.status !== 'string'))
    return false
  if ('cname' in value && value.cname !== null && typeof value.cname !== 'string')
    return false
  if (!('source' in value) || value.source === undefined)
    return true
  const source = value.source
  return Boolean(source && typeof source === 'object' && 'branch' in source && typeof source.branch === 'string' && 'path' in source && typeof source.path === 'string')
}
function isPagesBuild(value: unknown): value is PagesBuild {
  return Boolean(value && typeof value === 'object' && 'status' in value && typeof value.status === 'string' && 'commit' in value && typeof value.commit === 'string' && (!('updated_at' in value) || typeof value.updated_at === 'string'))
}
export function getPagesInfo(target: RepositoryIdentity) {
  return requestResult({ url: `/repos/${target.owner}/${target.repo}/pages`, method: 'GET', noCache: true }, isPagesInfo)
}
export function safeSiteUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  }
  catch { return false }
}
/** 不访问站点域名；可用证据全部来自 GitHub 受鉴权的构建查询。 */
export async function queryPagesDeployment(target: RepositoryIdentity, expectedSha?: string): Promise<ApiResult<DeploymentObservation>> {
  const ref = await getGitReference(target, GH_PAGES)
  if (!ref.ok) {
    if (ref.error.kind !== 'not-found' || expectedSha)
      return ref
    const repository = await requestResult({ url: `/repos/${target.owner}/${target.repo}`, method: 'GET', noCache: true }, (value): value is { name: string } => Boolean(value && typeof value === 'object' && 'name' in value && value.name === target.repo))
    return repository.ok ? { ok: true, data: { phase: 'not-deployed' } } : repository
  }
  const commitSha = expectedSha ?? ref.data.object.sha
  const waiting = { ok: true, data: { phase: 'waiting', commitSha } } as const
  const pages = await getPagesInfo(target)
  if (!pages.ok)
    return pages.error.kind === 'not-found' ? waiting : pages
  if (pages.data.source?.branch !== GH_PAGES || pages.data.source.path !== '/' || ref.data.object.sha !== commitSha)
    return waiting
  const build = await requestResult({ url: `/repos/${target.owner}/${target.repo}/pages/builds/latest`, method: 'GET', noCache: true }, isPagesBuild)
  if (!build.ok)
    return build.error.kind === 'not-found' ? waiting : build
  if (build.data.commit !== commitSha)
    return waiting
  if (build.data.status === 'errored' || pages.data.status === 'errored')
    return { ok: false, error: { kind: 'service', retryable: true } }
  if (pages.data.status !== 'built' || build.data.status !== 'built')
    return waiting
  const deployedAt = build.data.updated_at && Number.isFinite(Date.parse(build.data.updated_at)) ? build.data.updated_at : undefined
  return safeSiteUrl(pages.data.html_url)
    ? { ok: true, data: { phase: 'available', commitSha, url: pages.data.html_url, ...(deployedAt ? { deployedAt } : {}) } }
    : { ok: false, error: { kind: 'invalid-response', retryable: true } }
}
export async function configurePages(target: RepositoryIdentity, current: () => boolean, domain?: string): Promise<ApiResult<unknown>> {
  const existing = await getPagesInfo(target)
  if (!existing.ok && existing.error.kind !== 'not-found')
    return existing
  const conflict = { ok: false, error: { kind: 'conflict', retryable: true } } as const
  if (!current())
    return conflict
  const source = { branch: GH_PAGES, path: '/' }
  const desiredDomain = domain || null
  if (existing.ok) {
    const sourceMatches = existing.data.source?.branch === GH_PAGES && existing.data.source.path === '/'
    if (sourceMatches && (domain === undefined || (existing.data.cname ?? null) === desiredDomain))
      return { ok: true, data: null }
    return requestResult({ url: `/repos/${target.owner}/${target.repo}/pages`, method: 'PUT', data: { source, ...(domain === undefined ? {} : { cname: desiredDomain }) } }, (value): value is unknown => value !== undefined)
  }
  const created = await requestResult({ url: `/repos/${target.owner}/${target.repo}/pages`, method: 'POST', data: { source } }, isPagesInfo)
  if (!created.ok || domain === undefined || (created.data.cname ?? null) === desiredDomain)
    return created
  if (!current())
    return conflict
  return requestResult({ url: `/repos/${target.owner}/${target.repo}/pages`, method: 'PUT', data: { cname: desiredDomain } }, (value): value is unknown => value !== undefined)
}
