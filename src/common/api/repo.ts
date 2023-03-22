import { UserConfigInfoModel } from '@/common/model'
import { PICX_REPO_DESC, PICX_REPO_NAME } from '@/common/constant'
import request from '@/utils/request'

/**
 * 获取仓库信息列表
 * @param url
 */
export const getRepoInfoList = (url: string) => {
  return request({
    url,
    method: 'GET',
    data: {
      type: 'public',
      sort: 'created',
      per_page: 100
    }
  })
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
      message: 'Init repo via PicX(https://github.com/XPoet/picx)',
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
      name: PICX_REPO_NAME,
      description: PICX_REPO_DESC,
      private: false
    },
    headers: { Authorization: `token ${token}` },
    success422: true
  })
}
