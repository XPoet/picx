import { UploadedImageModel, UserConfigInfoModel, DeleteStatusEnum } from '@/common/model'
import axios from '@/utils/axios'
import { store } from '@/store'

export async function deleteSingleImage(
  imageObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel
): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  imageObj.deleting = true
  const { owner, selectedRepos } = userConfigInfo
  return new Promise((resolve, reject) => {
    axios
      .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
        data: {
          owner,
          repo: selectedRepos,
          path: imageObj.path,
          message: 'delete picture via PicX(https://github.com/XPoet/picx)',
          sha: imageObj.sha
        }
      })
      .then((res) => {
        if (res && res.status === 200) {
          // eslint-disable-next-line no-param-reassign
          imageObj.deleting = false
          store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
          store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
          resolve(true)
        } else {
          // eslint-disable-next-line no-param-reassign
          imageObj.deleting = false
          resolve(false)
        }
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export async function deleteMultiImages(
  imgObjs: UploadedImageModel[],
  userConfigInfo: UserConfigInfoModel
): Promise<void> {
  imgObjs.forEach((imgObj) => {
    imgObj.deleting = true
  })
  const { owner, selectedRepos: repo, selectedBranch: branch, viewDir } = userConfigInfo

  // 获取head，用于获取当前分支信息（根目录的tree sha以及head commit sha）
  const head = await axios.get(`/repos/${owner}/${repo}/branches/${branch}`)
  if (head?.status !== 200) {
    throw new Error('获取分支信息失败')
  }

  // 过滤路径多余的斜杠
  const path = viewDir
    .split('/')
    .filter((item) => item !== '')
    .join('/')

  // 获取当前的文件夹content
  const content = await axios.get(`/repos/${owner}/${repo}/contents/${path}`)
  if (content?.status !== 200) {
    throw new Error('获取文件夹内容失败')
  }

  // 创建tree，删除图片只需要将sha标记为null
  // ref: https://stackoverflow.com/questions/23637961/how-do-i-mark-a-file-as-deleted-in-a-tree-using-the-github-api
  const tree = await axios.post(`/repos/${owner}/${repo}/git/trees`, {
    tree: content.data
      .filter((item: { path: string }) =>
        imgObjs.some((imgObj) => imgObj.path === item.path)
      )
      .map((item: any) => ({
        type: 'blob',
        path: item.path,
        mode: '100644',
        sha: null
      })),
    base_tree: head?.data?.commit?.commit?.tree?.sha || null
  })
  if (tree?.status !== 201) {
    throw new Error('创建tree失败')
  }

  // 提交commit
  const commit = await axios.post(`/repos/${owner}/${repo}/git/commits`, {
    message: 'delete picture via PicX(https://github.com/XPoet/picx)',
    parents: [head.data.commit.sha],
    tree: tree.data.sha
  })
  if (commit?.status !== 201) {
    throw new Error('创建commit失败')
  }

  // 将当前分支ref指向新创建的commit
  const refRes = await axios.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.data.sha
  })
  if (refRes?.status !== 200) {
    throw new Error('更新ref失败')
  }

  imgObjs.forEach((imgObj) => {
    imgObj.deleting = false
    store.dispatch('UPLOADED_LIST_REMOVE', imgObj.uuid)
    store.dispatch('DIR_IMAGE_LIST_REMOVE', imgObj)
  })
}

export async function delelteBatchImage(
  imgCardArr: Array<UploadedImageModel>,
  userConfigInfo: UserConfigInfoModel
) {
  if (imgCardArr.length === 1) {
    if (await deleteSingleImage(imgCardArr[0], userConfigInfo)) {
      return DeleteStatusEnum.deleted
    }
    return DeleteStatusEnum.deleteFail
  }
  try {
    await deleteMultiImages(imgCardArr, userConfigInfo)
    return DeleteStatusEnum.allDeleted
  } catch (err) {
    console.error(err)
    return DeleteStatusEnum.deleteFail
  }
}
