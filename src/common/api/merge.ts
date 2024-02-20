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
    data: {
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
 * @param msg
 */
export const createCommit = (owner: string, repo: string, tree: any, head: any, msg?: string) => {
  return request({
    url: `/repos/${owner}/${repo}/git/commits`,
    method: 'POST',
    data: {
      tree: tree.sha,
      parents: [head.commit.sha],
      message: msg || PICX_UPLOAD_IMGS_DESC
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
    data: {
      sha
    }
  })
}
