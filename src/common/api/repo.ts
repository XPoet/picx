import { UserConfigInfoModel } from '@/common/model'
import { INIT_REPO_DESC, INIT_REPO_NAME, PICX_INIT_REPO_MSG } from '@/common/constant'
import request from '@/utils/request'

/**
 * 获取仓库列表
 * @param owner
 * @param page
 */
export const getRepoList = (owner: string, page = 1) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpList: any[] = await request({
      url: `users/${owner}/repos`,
      method: 'GET',
      params: {
        type: 'owner', // all | owner | member
        sort: 'created', // created | updated | pushed | full_name
        direction: 'desc', // asc | desc
        per_page: 100,
        page
      }
    })

    if (tmpList && tmpList.length) {
      resolve(
        tmpList
          .filter((v: any) => !v.fork && !v.private)
          .map((x: any) => ({
            value: x.name,
            label: x.name
          }))
      )
    } else {
      resolve(null)
    }
  })
}

/**
 * 获取所有的仓库列表（当前限制在 300 个以内）
 * @param owner
 */
export const getAllRepoList = async (owner: string) => {
  const tmpList = []
  // eslint-disable-next-line no-plusplus
  for (let i = 1; i <= 3; i++) {
    const res = await getRepoList(owner, i)
    if (res) {
      // @ts-ignore
      tmpList.push(...res)
    }
  }

  return Promise.resolve(tmpList.length ? tmpList : null)
}

/**
 * 初始化一个空仓库
 * @param userConfigInfo
 * @param showTips
 */
export const initEmptyRepo = async (
  userConfigInfo: UserConfigInfoModel,
  showTips: boolean = true
) => {
  const README = `
# Welcome to use PicX

[PicX](https://github.com/XPoet/picx) is a simple and powerful image hosting tool. It supports image hosting services via GitHub repository.

PicX is completely open source, and you can use it for free.

If you like it, please give it a star on [GitHub](https://github.com/XPoet/picx).
        `
  const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo

  let initRepoLoading = null

  if (showTips) {
    initRepoLoading = ElLoading.service({
      text: '正在初始化仓库...'
    })
  }

  // GitHub Git database API 不支持在空仓库上操作，需要先初始化空仓库
  // 仓库为空时，新建一个 README 文件来初始化仓库
  const res = await request({
    url: `/repos/${owner}/${repo}/contents/README.md`,
    method: 'PUT',
    data: {
      message: PICX_INIT_REPO_MSG,
      branch,
      content: window.btoa(README)
    },
    noShowErrorMsg: true
  })

  if (res) {
    initRepoLoading?.close()
  } else if (showTips) {
    ElMessage.error('仓库初始化失败')
  }
}

/**
 * 创建仓库
 * @param token
 */
export const createRepo = (token: string) => {
  return request({
    url: '/user/repos',
    method: 'POST',
    params: {
      name: INIT_REPO_NAME,
      description: INIT_REPO_DESC,
      private: false
    },
    headers: { Authorization: `token ${token}` },
    success422: true
  })
}
