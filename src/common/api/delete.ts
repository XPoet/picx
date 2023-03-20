import axios from '@/utils/axios'

/**
 * 从 GitHub 中删除单张图片
 * @param owner
 * @param repo
 * @param path
 * @param sha
 * @param callback
 */
export const deleteSingleImage = (
  owner: string,
  repo: string,
  path: string,
  sha: string,
  callback: any
) => {
  axios
    .delete(`/repos/${owner}/${repo}/contents/${path}`, {
      data: {
        owner,
        repo,
        path,
        message: 'Delete image via PicX(https://github.com/XPoet/picx)',
        sha
      }
    })
    .then((res) => {
      if (res && res.status === 200) {
        callback(res.data)
      } else {
        callback(null)
      }
    })
    .catch(() => {
      callback(null)
    })
}
