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
 * 上传 base64 内容，获取文件 blob
 * @param base64String
 * @param owner
 * @param repo
 */
export const getFileBlob = (base64String: string, owner: string, repo: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/blobs`,
    method: 'POST',
    data: {
      owner,
      repo,
      content: base64String,
      encoding: 'base64'
    }
  })
}
