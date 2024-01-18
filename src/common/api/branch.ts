import { UserConfigInfoModel } from '@/common/model'
import request from '@/utils/request'
import axios from '@/utils/request/axios'
import { GH_PAGES } from '@/common/constant'
import i18n from '@/plugins/vue/i18n'

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
    noCache: true
  })
}

/**
 * 获取分支信息列表
 * @param owner
 * @param repo
 */
export const getBranchInfoList = (
  owner: string,
  repo: string
): Promise<{ value: string; label: string }[]> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpList: any[] = await request({
      url: `/repos/${owner}/${repo}/branches`,
      method: 'GET',
      noCache: true
    })

    if (tmpList && tmpList.length) {
      resolve(
        tmpList
          .filter((x) => !x.protected)
          .map((v) => ({
            value: v.name,
            label: v.name
          }))
          .reverse()
      )
    } else {
      resolve([])
    }
  })
}

/**
 * 将当前分支 checkout 到 gh-pages 分支
 * 部署到 GitHub Pages，完成图片资源托管，获取访问能力
 * @param userConfigInfo
 * @param cb
 */
export const checkoutGhPagesBranch = async (userConfigInfo: UserConfigInfoModel, cb?: any) => {
  const { owner, repo, branch } = userConfigInfo

  const initLoading = ElLoading.service({
    text: i18n.global.t('settings_page.image_hosting_deploy.deploying')
  })

  const cbHandler = (evt: boolean = false) => {
    // eslint-disable-next-line no-unused-expressions
    cb && cb(evt)
    initLoading.close()
  }

  try {
    // 1、判断 gh-pages 是否存在
    const branchsRes = await getBranchInfoList(owner, repo)
    const hasGhPages = branchsRes.some((x) => x.value === GH_PAGES)

    let allowCreate = true

    // 存在则删除 gh-pages
    if (hasGhPages) {
      allowCreate = false
      const delRes = await axios.delete(`/repos/${owner}/${repo}/git/refs/heads/${GH_PAGES}`)
      if (delRes) {
        allowCreate = true
      } else {
        cbHandler(false)
        return
      }
    }

    // 允许创建 gh-pages
    if (allowCreate) {
      // 2、获取当前分支的 SHA 值
      let sha = ''
      const res1 = await request({
        url: `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        method: 'GET'
      })

      if (res1) {
        sha = res1?.object?.sha
      }

      if (!sha) {
        cbHandler(false)
        return
      }

      // 3、复制当前分支到 gh-pages
      const res2 = await request({
        url: `/repos/${owner}/${repo}/git/refs`,
        method: 'POST',
        data: {
          ref: `refs/heads/${GH_PAGES}`,
          sha
        }
      })

      // gh-pages 分支创建成功
      if (res2.object.sha) {
        // GitHub 部署 Pages 服务需要 50s 左右，利用 setTimeout 模拟部署进程
        setTimeout(() => {
          cbHandler(true)
        }, 50000)
      } else {
        cbHandler(false)
      }
    }
  } catch (err) {
    console.error(err)
    cbHandler(false)
  }
}
