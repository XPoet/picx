import request from '@/utils/request'
import { PICX_DEL_IMG_DESC } from '@/common/constant'

/**
 * 从 GitHub 中删除单张图片
 * @param owner
 * @param repo
 * @param path
 * @param sha
 */
export const deleteSingleImage = (owner: string, repo: string, path: string, sha: string) => {
  return request({
    url: `/repos/${owner}/${repo}/contents/${path}`,
    method: 'DELETE',
    data: {
      owner,
      repo,
      path,
      message: PICX_DEL_IMG_DESC,
      sha
    }
  })
}
