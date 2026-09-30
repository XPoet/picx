import type { DirModel, UserConfigInfoModel } from '@/common/model'
import { INIT_REPO_DESC, PICX_INIT_REPO_MSG } from '@/common/constant'
import request from '@/utils/request'

/**
 * 获取仓库列表
 * @param owner
 * @param page
 */
interface GitHubRepositorySummary {
  fork: boolean
  private: boolean
  name: string
}

export const getRepoList = async (owner: string, page = 1): Promise<DirModel[] | null> => {
  const repositories = await request({
    url: `users/${owner}/repos`,
    method: 'GET',
    params: {
      type: 'owner', // all | owner | member
      sort: 'created', // created | updated | pushed | full_name
      direction: 'desc', // asc | desc
      per_page: 100,
      page,
    },
  })

  if (!Array.isArray(repositories)) {
    return null
  }

  return (repositories as GitHubRepositorySummary[])
    .filter(repository => !repository.fork && !repository.private)
    .map(repository => ({
      value: repository.name,
      label: repository.name,
    }))
}

/**
 * 获取所有的仓库列表（当前限制在 300 个以内）
 * @param owner
 */
export const getAllRepoList = async (owner: string) => {
  const repositoryList: DirModel[] = []

  for (let i = 1; i <= 3; i++) {
    const repositories = await getRepoList(owner, i)
    if (repositories) {
      repositoryList.push(...repositories)
    }
  }

  return repositoryList.length ? repositoryList : null
}

/**
 * 初始化仓库 README
 * @param userConfigInfo
 */
export const initRepoREADME = async (userConfigInfo: UserConfigInfoModel) => {
  const README = `
# Welcome to use PicX

[PicX](https://github.com/XPoet/picx) is a simple and powerful image hosting tool. It supports image hosting services via GitHub repository.

PicX is completely open source, and you can use it for free.

If you like it, please give it a star on [GitHub](https://github.com/XPoet/picx).
        `
  const { owner, repo, branch } = userConfigInfo

  // GitHub Git database API 不支持在空仓库上操作，需要先初始化空仓库
  // 仓库为空时，新建一个 README 文件来初始化仓库
  await request({
    url: `/repos/${owner}/${repo}/contents/README.md`,
    method: 'PUT',
    data: {
      message: PICX_INIT_REPO_MSG,
      branch,
      content: window.btoa(README),
    },
    noShowErrMsg: true,
  })
}

/**
 * 创建仓库
 * @param token
 * @param repoName
 */
export const createRepo = (token: string, repoName: string) => {
  return request({
    url: '/user/repos',
    method: 'POST',
    data: {
      name: repoName,
      description: INIT_REPO_DESC,
      private: false,
    },
    headers: { Authorization: `Bearer ${token}` },
    success422: true,
    noShowErrMsg: true,
  })
}

/**
 * 获取仓库信息
 * @param owner
 * @param repo
 */
export const getRepoInfo = (owner: string, repo: string) => {
  return request({
    url: `/repos/${owner}/${repo}`,
    method: 'GET',
    noCache: true,
    success422: true,
    noShowErrMsg: true,
  })
}
