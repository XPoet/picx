import type { DirModel, UserConfigInfoModel } from '@/common/model'
import type { ApiResult } from '@/utils/request/types'
import request, { requestResult } from '@/utils/request'

export interface RepositoryContent {
  type: string
  name: string
  path: string
  sha: string
  size: number
}

function isContents(value: unknown): value is RepositoryContent[] {
  return Array.isArray(value) && value.every(item => item && typeof item === 'object'
    && typeof item.type === 'string' && typeof item.name === 'string'
    && typeof item.path === 'string' && typeof item.sha === 'string' && typeof item.size === 'number')
}

export async function getRepoPathContentResult(
  config: Pick<UserConfigInfoModel, 'owner' | 'repo' | 'branch'>,
  path = '',
  token?: string,
): Promise<ApiResult<RepositoryContent[]>> {
  const { owner, repo, branch } = config
  return requestResult({
    url: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path === '/' ? '' : path.split('/').map(encodeURIComponent).join('/')}`,
    method: 'GET',
    noCache: true,
    params: { ref: branch },
    ...(token === undefined ? {} : { headers: { Authorization: `Bearer ${token}` } }),
  }, isContents)
}

export async function getDirInfoListResult(
  config: Pick<UserConfigInfoModel, 'owner' | 'repo' | 'branch'>,
  path = '',
  token?: string,
): Promise<ApiResult<DirModel[]>> {
  const result = await getRepoPathContentResult(config, path, token)
  return result.ok
    ? { ok: true, data: result.data.filter(item => item.type === 'dir').map(item => ({ value: item.name, label: item.name })) }
    : result
}

// 兼容旧配置页，迁移中的页面使用可区分空与失败的 Result 版本。
export async function getDirInfoList(config: UserConfigInfoModel, path = ''): Promise<DirModel[]> {
  const result = await getDirInfoListResult(config, path)
  return result.ok ? result.data : []
}

/**
 * 获取仓库指定路径的内容（不做缓存）
 * @param owner
 * @param repo
 * @param path
 */
export const getRepoDirContent = (owner: string, repo: string, path: string = '') => {
  return request({
    url: `/repos/${owner}/${repo}/contents/${path}`,
    method: 'GET',
    noCache: true,
  })
}

/**
 * 获取指定文件最近一次 commit 的时间（用作图床管理页的上传时间）
 * @param userConfigInfo
 * @param path 文件在仓库内的完整路径
 * @returns 毫秒时间戳；无记录或请求失败时返回 null
 */
export const getLatestCommitTime = (
  userConfigInfo: UserConfigInfoModel,
  path: string,
): Promise<number | null> => {
  const { owner, repo, branch } = userConfigInfo

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const res = await request({
      url: `/repos/${owner}/${repo}/commits`,
      method: 'GET',
      noCache: true,
      noShowErrMsg: true,
      params: {
        path,
        per_page: 1,
        ref: branch,
      },
    })

    const date = res?.[0]?.commit?.author?.date
    const timestamp = date ? Date.parse(date) : NaN
    resolve(Number.isNaN(timestamp) ? null : timestamp)
  })
}

/** 目录 API 仅返回数据；页面状态写入由业务编排承担。 */
export async function getRepoPathContent(config: UserConfigInfoModel, path = '') {
  const result = await getRepoPathContentResult(config, path)
  return result.ok ? result.data : null
}
