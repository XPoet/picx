import { UploadedImageModel, UserConfigInfoModel, DeleteStatusEnum } from '@/common/model'
import axios from '@/utils/axios'
import { store } from '@/store'

export async function deleteSingleImage(
  imageObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel
): Promise<boolean> {
  imageObj.deleting = true
  const { owner, selectedRepos } = userConfigInfo
  return new Promise((resolve, reject) => {
    axios
      .delete(`/repos/${owner}/${selectedRepos}/contents/${imageObj.path}`, {
        data: {
          owner,
          repo: selectedRepos,
          path: imageObj.path,
          message: 'Delete image via PicX(https://github.com/XPoet/picx)',
          sha: imageObj.sha
        }
      })
      .then((res) => {
        if (res && res.status === 200) {
          imageObj.deleting = false
          store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
          store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
          resolve(true)
        } else {
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
  const { owner, selectedRepos: repo, selectedBranch: branch } = userConfigInfo

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const head = await axios.get(`/repos/${owner}/${repo}/branches/${branch}`)
  if (head?.status !== 200) {
    imgObjs.forEach((imgObj) => {
      imgObj.deleting = false
    })
    throw new Error('获取分支信息失败')
  }

  // 创建 tree，删除图片只需要将 sha 标记为 null
  const tree = await axios.post(`/repos/${owner}/${repo}/git/trees`, {
    tree: imgObjs.map((img) => ({
      mode: '100644',
      path: img.path,
      sha: null,
      type: 'blob'
    })),
    base_tree: head?.data?.commit?.commit?.tree?.sha || null
  })
  if (tree?.status !== 201) {
    imgObjs.forEach((imgObj) => {
      imgObj.deleting = false
    })
    throw new Error('创建 tree 失败')
  }

  // 提交 commit
  const commit = await axios.post(`/repos/${owner}/${repo}/git/commits`, {
    message: 'Delete images via PicX(https://github.com/XPoet/picx)',
    parents: [head.data.commit.sha],
    tree: tree.data.sha
  })
  if (commit?.status !== 201) {
    imgObjs.forEach((imgObj) => {
      imgObj.deleting = false
    })
    throw new Error('创建 commit 失败')
  }

  // 将当前分支 ref 指向新创建的 commit
  const refRes = await axios.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.data.sha
  })
  if (refRes?.status !== 200) {
    imgObjs.forEach((imgObj) => {
      imgObj.deleting = false
    })
    throw new Error('更新 ref 失败')
  }

  imgObjs.forEach((imgObj) => {
    imgObj.deleting = false
    store.dispatch('UPLOADED_LIST_REMOVE', imgObj.uuid)
    store.dispatch('DIR_IMAGE_LIST_REMOVE', imgObj)
  })
}

export async function deleteImagesOfGH(
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
