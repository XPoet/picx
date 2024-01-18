import {
  DeleteStatusEnum,
  UploadedImageModel,
  UploadImageModel,
  UserConfigInfoModel
} from '@/common/model'
import { getUuid } from '@/utils/common-utils'
import { store } from '@/stores'
import { createCommit, createRef, createTree, deleteSingleImage, getBranchInfo } from '@/common/api'
import request from '@/utils/request'

/**
 * 生成一个上传的图片对象
 */
export const createUploadImageObject = (): UploadImageModel => {
  return {
    uuid: '',
    base64: {
      originalBase64: '',
      watermarkBase64: null,
      compressBase64: null
    },
    fileInfo: {
      originalFile: null,
      watermarkFile: null,
      compressFile: null
    },
    filename: {
      hash: '',
      suffix: '',
      name: '',
      prefix: '',
      final: '',
      initName: '',
      newName: '',
      isAddHash: true,
      isRename: false,
      isAddPrefix: false
    },
    beforeUploadStatus: {
      watermarking: false,
      compressing: false
    },
    uploadStatus: {
      progress: 0,
      uploading: false
    },
    reUploadInfo: {
      dir: '',
      path: '',
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
  const { owner, repo } = userConfigInfo
  const { path, sha } = imageObj
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const res = await deleteSingleImage(owner, repo, path, sha)
    imageObj.deleting = false
    if (res) {
      resolve(true)
      await store.dispatch('UPLOAD_IMG_LIST_REMOVE', imageObj.uuid)
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
  const { owner, repo, branch } = userConfigInfo

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
    store.dispatch('UPLOAD_IMG_LIST_REMOVE', imgObj.uuid)
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
    img.onerror = () => {
      resolve(null)
    }
  })
}

/**
 * 根据图片链接获取图片 blob 转 base64 编码
 * @param url 图片路径
 */
export function blobToBase64ByImageUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    request({
      baseURL: '',
      url,
      method: 'GET',
      responseType: 'blob'
    })
      .then((res) => {
        if (res) {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            resolve(base64)
          }
          reader.onerror = () => {
            resolve(null)
          }
          reader.readAsDataURL(res)
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
 * 图片 File 格式转 Base64 格式
 * @param file
 */
export function imgFileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = () => resolve(null)
  })
}

/**
 * 下载 File 格式的图片
 * @param file
 */
export function downloadImage(file: File) {
  const url = URL.createObjectURL(file) // 创建图片 URL
  const link = document.createElement('a') // 创建一个 a 标签
  link.href = url // 设置链接地址为图片 URL
  link.download = file.name // 设置下载文件的文件名
  document.body.appendChild(link) // 将 a 标签添加到 body 中
  link.click() // 模拟点击链接进行下载
  document.body.removeChild(link) // 下载完成后移除 a 标签
  URL.revokeObjectURL(url) // 释放图片 URL
}
