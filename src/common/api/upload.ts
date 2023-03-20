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
      console.log('uploadImageAPI >> ', res)
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

/**
 * 创建 blobs 的 tree
 * @param owner
 * @param repo
 * @param blobs
 * @param path
 * @param head
 */
export const createTree = (owner: string, repo: string, blobs: any[], path: string, head: any) => {
  return new Promise((resolve) => {
    axios
      .post(`/repos/${owner}/${repo}/git/trees`, {
        tree: blobs.map((blob: any) => ({
          path: `${path}${blob.img.filename.final}`,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        })),
        base_tree: head?.commit?.commit?.tree?.sha || null
      })
      .then((res: any) => {
        console.log('createTree >> ', res)
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

/**
 *创建 commit
 * @param owner
 * @param repo
 * @param tree
 * @param head
 */
export const createCommit = (owner: string, repo: string, tree: any, head: any) => {
  return new Promise((resolve) => {
    axios
      .post(`/repos/${owner}/${repo}/git/commits`, {
        tree: tree.sha,
        parents: [head.commit.sha],
        message: 'Upload images via PicX(https://github.com/XPoet/picx)'
      })
      .then((res: any) => {
        console.log('createCommit >> ', res)
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

/**
 * 创建 ref
 * @param owner
 * @param repo
 * @param branch
 * @param commit
 */
export const createRef = (owner: string, repo: string, branch: string, commit: any) => {
  return new Promise((resolve) => {
    axios
      .patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        sha: commit.sha
      })
      .then((res: any) => {
        console.log('createRef >> ', res)
        if (res && res.status === 200) {
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
