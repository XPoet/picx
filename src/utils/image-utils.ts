import {
  DeleteStatusEnum,
  ToUploadImageModel,
  UploadedImageModel,
  UserConfigInfoModel
} from '@/common/model'
import { getUuid } from '@/utils/common-utils'
import { store } from '@/store'
import { createCommit, createRef, createTree, deleteSingleImage, getBranchInfo } from '@/common/api'

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
 * 从 GitHub 中删除单张图片
 * @param imageObj
 * @param userConfigInfo
 */
export async function deleteImageFromGitHub(
  imageObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel
): Promise<boolean> {
  imageObj.deleting = true
  const { owner, selectedRepo: repo } = userConfigInfo
  const { path, sha } = imageObj
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const res = await deleteSingleImage(owner, repo, path, sha)
    imageObj.deleting = false
    if (res) {
      resolve(true)
      await store.dispatch('UPLOADED_LIST_REMOVE', imageObj.uuid)
      await store.dispatch('DIR_IMAGE_LIST_REMOVE', imageObj)
    } else {
      resolve(false)
    }
  })
}

const imgListDeleteStatus = (imgList: UploadedImageModel[], deleting: boolean = false) => {
  imgList.forEach((img) => {
    img.deleting = deleting
  })
}

/**
 * 删除多张图片
 * @param imgObjs
 * @param userConfigInfo
 */
export async function deleteImagesFromGitHub(
  imgObjs: UploadedImageModel[],
  userConfigInfo: UserConfigInfoModel
): Promise<void> {
  imgListDeleteStatus(imgObjs, true)
  const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const headRes: any = await getBranchInfo(owner, repo, branch)
  if (!headRes) {
    imgListDeleteStatus(imgObjs, false)
    throw new Error('获取分支信息失败')
  }

  // 创建 tree，删除图片只需要将 sha 标记为 null
  const treeRes = await createTree(
    owner,
    repo,
    imgObjs.map((x) => ({
      path: x.path,
      sha: null
    })),
    headRes
  )
  if (!treeRes) {
    imgListDeleteStatus(imgObjs, false)
    throw new Error('创建 tree 失败')
  }

  // 提交 commit
  const commitRes = await createCommit(owner, repo, treeRes, headRes)
  if (!commitRes) {
    imgListDeleteStatus(imgObjs, false)
    throw new Error('创建 commit 失败')
  }

  // 将当前分支 ref 指向新创建的 commit
  // @ts-ignore
  const refRes = await createRef(owner, repo, branch, commitRes.sha)
  if (!refRes) {
    imgListDeleteStatus(imgObjs, false)
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
    if (await deleteImageFromGitHub(imgCardArr[0], userConfigInfo)) {
      return DeleteStatusEnum.deleted
    }
    return DeleteStatusEnum.deleteFail
  }
  try {
    await deleteImagesFromGitHub(imgCardArr, userConfigInfo)
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
