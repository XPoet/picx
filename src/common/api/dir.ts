import type { UserConfigInfoModel } from '@/common/model'
import { store } from '@/stores'
import { createManagementImageObject, getFileSuffix, isImage, isVideo } from '@/utils'
import request from '@/utils/request'

/**
 * 获取指定路径 Path 下的目录列表
 * @param userConfigInfo
 * @param path 路径
 */
export const getDirInfoList = (
  userConfigInfo: UserConfigInfoModel,
  path: string = '',
): Promise<[]> => {
  const { owner, repo, branch } = userConfigInfo
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpList = await request({
      url: `/repos/${owner}/${repo}/contents/${path}`,
      method: 'GET',
      noShowErrMsg: true,
      params: {
        ref: branch,
      },
    })

    if (tmpList && tmpList.length) {
      resolve(
        tmpList
          .filter((v: any) => v.type === 'dir')
          .map((x: any) => ({
            value: x.name,
            label: x.name,
          })),
      )
    }
    else {
      resolve([])
    }
  })
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

/**
 * 获取指定路径 Path 下的目录和图片
 * @param userConfigInfo
 * @param path
 */
export const getRepoPathContent = (userConfigInfo: UserConfigInfoModel, path: string = '') => {
  const { owner, repo, branch } = userConfigInfo

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const res = await request({
      url: `/repos/${owner}/${repo}/contents/${path}`,
      method: 'GET',
      noCache: true,
      params: {
        ref: branch,
      },
    })

    if (res && res.length) {
      res
        .filter((v: any) => v.type === 'dir')
        .forEach((x: any) => store.dispatch('DIR_IMAGE_LIST_ADD_DIR', x.path))

      setTimeout(() => {
        res
          .filter(
            (v: any) =>
              v.type === 'file'
              && (isImage(getFileSuffix(v.name)) || isVideo(getFileSuffix(v.name))),
          )
          .forEach((x: any) => {
            store.dispatch(
              'DIR_IMAGE_LIST_ADD_IMAGE',
              createManagementImageObject(x, path, isVideo(x.name) ? 'video' : 'image'),
            )
          })
      }, 120)

      resolve(true)
    }
    else {
      resolve(null)
    }
  })
}
