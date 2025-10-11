import { store } from '@/stores'
import { getFileSuffix, isImage, createManagementImageObject, isVideo } from '@/utils'
import request from '@/utils/request'
import { UserConfigInfoModel } from '@/common/model'
import { createManagementVideoObject } from '@/utils/video-utils'

/**
 * 获取指定路径 Path 下的目录列表
 * @param userConfigInfo
 * @param path 路径
 */
export const getDirInfoList = (
  userConfigInfo: UserConfigInfoModel,
  path: string = ''
): Promise<[]> => {
  const { owner, repo, branch } = userConfigInfo
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpList = await request({
      url: `/repos/${owner}/${repo}/contents/${path}`,
      method: 'GET',
      noShowErrMsg: true,
      params: {
        ref: branch
      }
    })

    if (tmpList && tmpList.length) {
      resolve(
        tmpList
          .filter((v: any) => v.type === 'dir')
          .map((x: any) => ({
            value: x.name,
            label: x.name
          }))
      )
    } else {
      resolve([])
    }
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
        ref: branch
      }
    })

    if (res && res.length) {
      res
        .filter((v: any) => v.type === 'dir')
        .forEach((x: any) => store.dispatch('DIR_IMAGE_LIST_ADD_DIR', x.path))

      setTimeout(() => {
        res
          .filter((v: any) => {
            const suffix = getFileSuffix(v.name)
            return v.type === 'file' && (isImage(suffix) || isVideo(suffix))
          })
          .forEach((x: any) => {
            const suffix = getFileSuffix(x.name)
            if (isImage(suffix)) {
              store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', createManagementImageObject(x, path))
            } else if (isVideo(suffix)) {
              store.dispatch('DIR_IMAGE_LIST_ADD_VIDEO', createManagementVideoObject(x, path))
            }
          })
      }, 120)

      resolve(true)
    } else {
      resolve(null)
    }
  })
}
