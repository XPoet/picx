import {
  DeleteStatusEnum,
  ToUploadImageModel,
  UploadedImageModel,
  UserConfigInfoModel
} from '@/common/model'
import { getUuid } from '@/utils/common-utils'
import axios from '@/utils/axios'
import { store } from '@/store'

/**
 * 生成一个等待上传的图片对象
 */
export const createToUploadImageObject = (): ToUploadImageModel => {
  return {
    uuid: '',

    uploadStatus: {
      progress: 0,
      uploading: false
    },

    imgData: {
      base64Content: '',
      base64Url: ''
    },

    fileInfo: {
      size: 0,
      lastModified: 0
    },

    filename: {
      name: '',
      hash: '',
      suffix: '',
      prefixName: '',
      final: '',
      initName: '',
      newName: 'xxx',
      isHashRename: true,
      isRename: false,
      isPrefix: false
    },

    reUploadInfo: {
      path: '',
      dir: '',
      isReUpload: false
    }
  }
}

/**
 * 生成一个图床管理中的图片对象
 * @param item
 * @param selectedDir
 */
export const createManagementImageObject = (item: any, selectedDir: string): UploadedImageModel => {
  return {
    type: 'image',
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    sha: item.sha,
    path: item.path,
    deleting: false,
    size: item.size,
    checked: false
  }
}

/**
 * 删除单张图片
 * @param imageObj
 * @param userConfigInfo
 */
export async function deleteSingleImage(
  imageObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel
): Promise<boolean> {
  imageObj.deleting = true
  const { owner, selectedRepo } = userConfigInfo
  return new Promise((resolve, reject) => {
    axios
      .delete(`/repos/${owner}/${selectedRepo}/contents/${imageObj.path}`, {
        data: {
          owner,
          repo: selectedRepo,
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

/**
 * 删除多张图片
 * @param imgObjs
 * @param userConfigInfo
 */
export async function deleteMultiImages(
  imgObjs: UploadedImageModel[],
  userConfigInfo: UserConfigInfoModel
): Promise<void> {
  imgObjs.forEach((imgObj) => {
    imgObj.deleting = true
  })
  const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo

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

/**
 * 从 GitHub 中删除图片
 * @param imgCardArr
 * @param userConfigInfo
 */
export async function deleteImageOfGitHub(
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

/**
 * 根据图片链接获取图片 base64 编码
 * @param url 图片路径
 * @param ext 图片格式
 */
export function getBase64ByImageUrl(url: string, ext: string): Promise<string | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = url
  return new Promise((resolve) => {
    img.onload = () => {
      const { width } = img
      const { height } = img
      canvas.width = width // 指定画板的高度，自定义
      canvas.height = height // 指定画板的宽度，自定义
      ctx?.drawImage(img, 0, 0, width, height) // 参数可自定义
      const dataURL: string = canvas.toDataURL(`image/${ext}`)
      resolve(dataURL)
    }
  })
}
