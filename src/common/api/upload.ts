import request from '@/utils/request'
import { UploadImageModel } from '@/common/model'

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
export const uploadImageBlob = (img: UploadImageModel, owner: string, repo: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/blobs`,
    method: 'POST',
    params: {
      owner,
      repo,
      content: (
        img.base64.compressBase64 ||
        img.base64.watermarkBase64 ||
        img.base64.originalBase64
      ).split(',')[1],
      encoding: 'base64'
    }
  })
}
