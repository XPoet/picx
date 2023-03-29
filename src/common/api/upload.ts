import { ToUploadImageModel } from '@/common/model'
import request from '@/utils/request'

/**
 * 上传单张图片到 GitHub
 * @param url
 * @param data
 */
export const uploadSingleImage = (url: string, data: any) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

/**
 * 上传图片，获取 blob
 * @param img
 * @param owner
 * @param repo
 */
export const uploadImageBlob = (img: ToUploadImageModel, owner: string, repo: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/blobs`,
    method: 'POST',
    params: {
      owner,
      repo,
      content: img.imgData.base64Content,
      encoding: 'base64'
    }
  })
}
