import axios from '@/utils/axios'
import { ToUploadImageModel } from '@/common/model'

/**
 * 上传单张图片到 GitHub
 * @param url
 * @param putInfo
 * @param callback
 */
export const uploadSingleImage = <T extends (...args: any) => void>(
  url: string,
  putInfo: T,
  callback: T
) => {
  axios
    .put(url, putInfo)
    .then((res: any) => {
      console.log('uploadSingleImage >> ', res)
      if (res && res.status === 201) {
        callback(res.data)
      } else {
        callback(null)
      }
    })
    .catch(() => {
      callback(null)
    })
}

/**
 * 上传图片，获取 blob
 * @param img
 * @param owner
 * @param repo
 */
export const uploadImageBlob = (img: ToUploadImageModel, owner: string, repo: string) => {
  return new Promise((resolve) => {
    axios
      .post(`/repos/${owner}/${repo}/git/blobs`, {
        owner,
        repo,
        content: img.imgData.base64Content,
        encoding: 'base64'
      })
      .then((res: any) => {
        console.log('uploadImageBlob >> ', res)
        if (res && res.status === 201) {
          resolve(res.data)
        } else {
          resolve(null)
        }
      })
      .catch(() => {
        resolve(null)
      })
  })
}
