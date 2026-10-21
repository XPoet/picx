import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiResult } from '@/utils/request/types'
import { GH_PAGES } from '@/common/constant'
import request, { requestResult } from '@/utils/request'

/**
 * 获取分支信息
 * @param owner
 * @param repo
 * @param branch
 */
export const getBranchInfo = (owner: string, repo: string, branch: string) => {
  return request({
    url: `/repos/${owner}/${repo}/branches/${branch}`,
    method: 'GET',
    noCache: true,
  })
}

/**
 * 判断远端仓库是否存在指定分支（如 gh-pages）
 * 分支不存在时 GitHub 返回 404，静默处理并视为不存在
 * @param owner
 * @param repo
 * @param branch
 */
export const isBranchExist = async (
  owner: string,
  repo: string,
  branch: string,
): Promise<boolean> => {
  const res = await request({
    url: `/repos/${owner}/${repo}/branches/${branch}`,
    method: 'GET',
    noCache: true,
    noShowErrMsg: true,
  })
  return !!res
}

/**
 * 获取分支信息列表
 * @param owner
 * @param repo
 */
export const getBranchInfoList = (
  owner: string,
  repo: string,
): Promise<{ value: string, label: string }[]> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpList: any[] = await request({
      url: `/repos/${owner}/${repo}/branches`,
      method: 'GET',
      noCache: true,
    })

    if (tmpList && tmpList.length) {
      resolve(
        tmpList
          .filter(x => !x.protected)
          .map(v => ({
            value: v.name,
            label: v.name,
          }))
          .reverse(),
      )
    }
    else {
      resolve([])
    }
  })
}

export interface GitReference { object: { sha: string } }
export function isGitReference(value: unknown): value is GitReference {
  return Boolean(value && typeof value === 'object' && 'object' in value && value.object && typeof value.object === 'object' && 'sha' in value.object && typeof value.object.sha === 'string' && value.object.sha)
}
export function getGitReference(target: RepositoryIdentity, branch: string) {
  return requestResult({ url: `/repos/${target.owner}/${target.repo}/git/ref/heads/${encodeURIComponent(branch)}`, method: 'GET', noCache: true }, isGitReference)
}
/** 只报告 Git ref 提交结果，Pages 可用性由部署服务查询。 */
export async function checkoutGhPagesBranch(
  target: RepositoryIdentity,
  allowRebuild = false,
  current: () => boolean = () => true,
): Promise<ApiResult<{ commitSha: string }>> {
  const fail = { ok: false, error: { kind: 'conflict', retryable: true } } as const
  if (target.branch === GH_PAGES || !current())
    return fail
  const source = await getGitReference(target, target.branch)
  if (!source.ok)
    return source
  const existing = await getGitReference(target, GH_PAGES)
  if (!existing.ok && existing.error.kind !== 'not-found')
    return existing
  if (!current())
    return fail
  if (existing.ok) {
    if (!allowRebuild)
      return fail
    const removed = await requestResult({ url: `/repos/${target.owner}/${target.repo}/git/refs/heads/${GH_PAGES}`, method: 'DELETE' }, (value): value is unknown => value === '' || value === undefined || value === null)
    if (!removed.ok)
      return removed
  }
  if (!current())
    return fail
  const created = await requestResult({ url: `/repos/${target.owner}/${target.repo}/git/refs`, method: 'POST', data: { ref: `refs/heads/${GH_PAGES}`, sha: source.data.object.sha } }, isGitReference)
  return created.ok ? { ok: true, data: { commitSha: created.data.object.sha } } : created
}
