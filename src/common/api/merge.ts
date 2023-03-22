import request from '@/utils/request'
import { PICX_UPLOAD_IMGS_DESC } from '@/common/constant'

/**
 * 创建 blobs 的 tree
 * @param owner
 * @param repo
 * @param blobs
 * @param head
 */
export const createTree = (owner: string, repo: string, blobs: any[], head: any) => {
  return request({
    url: `/repos/${owner}/${repo}/git/trees`,
    method: 'POST',
    params: {
      tree: blobs.map((blob: any) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      })),
      base_tree: head?.commit?.commit?.tree?.sha || null
    }
  })
}

/**
 *创建 commit
 * @param owner
 * @param repo
 * @param tree
 * @param head
 */
export const createCommit = (owner: string, repo: string, tree: any, head: any) => {
  return request({
    url: `/repos/${owner}/${repo}/git/commits`,
    method: 'POST',
    params: {
      tree: tree.sha,
      parents: [head.commit.sha],
      message: PICX_UPLOAD_IMGS_DESC
    }
  })
}

/**
 * 创建 ref
 * @param owner
 * @param repo
 * @param branch
 * @param sha
 */
export const createRef = (owner: string, repo: string, branch: string, sha: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    method: 'PATCH',
    params: {
      sha
    }
  })
}
