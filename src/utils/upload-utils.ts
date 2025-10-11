import { UploadedImageModel, UserConfigInfoModel, UploadImageModel } from '@/common/model'
import { UploadedVideoModel, UploadVideoModel } from '@/common/model/video'
import { store } from '@/stores'
import {
  createCommit,
  createRef,
  createTree,
  uploadSingleImage,
  getFileBlob,
  getBranchInfo
} from '@/common/api'
import {
  PICX_UPLOAD_IMG_DESC,
  PICX_UPLOAD_VIDEO_DESC,
  PICX_UPLOAD_VIDEOS_DESC
} from '@/common/constant'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'

/**
 * 图片上传成功之后的处理
 * @param res
 * @param img
 * @param userConfigInfo
 */
const uploadedHandle = (
  res: { name: string; sha: string; path: string; size: number },
  img: UploadImageModel,
  userConfigInfo: UserConfigInfoModel
) => {
  let dir = userConfigInfo.selectedDir

  if (img?.reUploadInfo?.isReUpload) {
    dir = img.reUploadInfo.dir
  }

  // 上传状态处理
  img.uploadStatus.progress = 100
  img.uploadStatus.uploading = false

  const uploadedImg: UploadedImageModel = {
    checked: false,
    type: 'image',
    uuid: img.uuid,
    dir,
    name: res.name,
    sha: res.sha,
    path: res.path,
    deleting: false,
    size: res.size,
    deployed: true
  }

  img.uploadedImg = uploadedImg

  // dirImageList 增加目录
  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', dir)

  // dirImageList 增加图片
  store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', uploadedImg)
}

/**
 * 上传图片的 URL 处理
 * @param config
 * @param imgObj
 */
export const uploadUrlHandle = (config: UserConfigInfoModel, imgObj: UploadImageModel): string => {
  const { owner, repo, selectedDir: dir } = config
  const filename: string = imgObj.filename.final

  let path = filename

  if (dir !== '/') {
    path = `${dir}/${filename}`
  }

  if (imgObj?.reUploadInfo?.isReUpload) {
    path = imgObj.reUploadInfo.path
  }

  return `/repos/${owner}/${repo}/contents/${path}`
}

/**
 * 上传多张图片到 GitHub 仓库
 * @param userConfigInfo
 * @param imgs
 */
export async function uploadImagesToGitHub(
  userConfigInfo: UserConfigInfoModel,
  imgs: UploadImageModel[]
): Promise<boolean> {
  const { branch, repo, selectedDir, owner } = userConfigInfo

  const blobs = []
  // eslint-disable-next-line no-restricted-syntax
  for (const img of imgs) {
    img.uploadStatus.uploading = true
    const tempBase64 = (
      img.base64.compressBase64 ||
      img.base64.watermarkBase64 ||
      img.base64.originalBase64
    ).split(',')[1]
    // 上传图片文件，为仓库创建 blobs
    const blobRes = await getFileBlob(tempBase64, owner, repo)
    if (blobRes) {
      blobs.push({ img, ...blobRes })
    } else {
      img.uploadStatus.uploading = false
      ElMessage.error(i18n.global.t('upload_page.tip_11', { name: img.filename.final }))
    }
  }

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const branchRes: any = await getBranchInfo(owner, repo, branch)
  if (!branchRes) {
    return Promise.resolve(false)
  }

  const finalPath = selectedDir === '/' ? '' : `${selectedDir}/`

  // 创建 tree
  const treeRes = await createTree(
    owner,
    repo,
    blobs.map((x: any) => ({
      sha: x.sha,
      path: `${finalPath}${x.img.filename.final}`
    })),
    branchRes
  )
  if (!treeRes) {
    return Promise.resolve(false)
  }

  // 创建 commit 节点
  const commitRes: any = await createCommit(owner, repo, treeRes, branchRes)
  if (!commitRes) {
    return Promise.resolve(false)
  }

  // 将当前分支 ref 指向新创建的 commit
  const refRes = await createRef(owner, repo, branch, commitRes.sha)
  if (!refRes) {
    return Promise.resolve(false)
  }

  blobs.forEach((blob: any) => {
    const name = blob.img.filename.final
    uploadedHandle(
      { name, sha: blob.sha, path: `${finalPath}${name}`, size: 0 },
      blob.img,
      userConfigInfo
    )
  })
  return Promise.resolve(true)
}

/**
 * 上传一张图片到 GitHub 仓库
 * @param userConfigInfo
 * @param img
 */
export function uploadImageToGitHub(
  userConfigInfo: UserConfigInfoModel,
  img: UploadImageModel
): Promise<Boolean> {
  const { branch, email, owner } = userConfigInfo

  const data: any = {
    message: PICX_UPLOAD_IMG_DESC,
    branch,
    content: (
      img.base64.compressBase64 ||
      img.base64.watermarkBase64 ||
      img.base64.originalBase64
    ).split(',')[1]
  }

  if (email) {
    data.committer = {
      name: owner,
      email
    }
  }

  img.uploadStatus.uploading = true

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const uploadRes = await uploadSingleImage(uploadUrlHandle(userConfigInfo, img), data)
    console.log('uploadSingleImage >> ', uploadRes)
    img.uploadStatus.uploading = false
    if (uploadRes) {
      const { name, sha, path, size } = uploadRes.content
      uploadedHandle({ name, sha, path, size }, img, userConfigInfo)
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

/**
 * 视频上传成功之后的处理
 * @param res
 * @param video
 * @param userConfigInfo
 */
const videoUploadedHandle = (
  res: { name: string; sha: string; path: string; size: number },
  video: UploadVideoModel,
  userConfigInfo: UserConfigInfoModel
) => {
  let dir = userConfigInfo.selectedDir

  if (video?.reUploadInfo?.isReUpload) {
    dir = video.reUploadInfo.dir
  }

  // 上传状态处理
  video.uploadStatus.progress = 100
  video.uploadStatus.uploading = false

  const uploadedVideo: UploadedVideoModel = {
    checked: false,
    type: 'video',
    uuid: video.uuid,
    dir,
    name: res.name,
    sha: res.sha,
    path: res.path,
    deleting: false,
    size: res.size,
    deployed: true
  }

  video.uploadedVideo = uploadedVideo

  // dirImageList 增加目录
  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', dir)

  // dirImageList 增加视频
  store.dispatch('DIR_IMAGE_LIST_ADD_VIDEO', uploadedVideo)
}

/**
 * 上传视频的 URL 处理
 * @param config
 * @param videoObj
 */
export const uploadVideoUrlHandle = (
  config: UserConfigInfoModel,
  videoObj: UploadVideoModel
): string => {
  const { owner, repo, selectedDir: dir } = config
  const filename: string = videoObj.filename.final

  let path = filename

  if (dir !== '/') {
    path = `${dir}/${filename}`
  }

  if (videoObj?.reUploadInfo?.isReUpload) {
    path = videoObj.reUploadInfo.path
  }

  return `/repos/${owner}/${repo}/contents/${path}`
}

/**
 * 上传一个视频到 GitHub 仓库
 * @param userConfigInfo
 * @param video
 */
export function uploadVideoToGitHub(
  userConfigInfo: UserConfigInfoModel,
  video: UploadVideoModel
): Promise<Boolean> {
  const { branch, email, owner } = userConfigInfo

  const data: any = {
    message: PICX_UPLOAD_VIDEO_DESC,
    branch,
    content: video.base64.originalBase64.split(',')[1]
  }

  if (email) {
    data.committer = {
      name: owner,
      email
    }
  }

  video.uploadStatus.uploading = true

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const uploadRes = await uploadSingleImage(uploadVideoUrlHandle(userConfigInfo, video), data)
    console.log('uploadSingleVideo >> ', uploadRes)
    video.uploadStatus.uploading = false
    if (uploadRes) {
      const { name, sha, path, size } = uploadRes.content
      videoUploadedHandle({ name, sha, path, size }, video, userConfigInfo)
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

/**
 * 校验用户配置信息
 * @param userConfigInfo 用户配置信息
 */
async function validateConfig(userConfigInfo: UserConfigInfoModel) {
  const { token, repo, selectedDir } = userConfigInfo

  if (!token) {
    ElMessage.error({ message: i18n.global.t('upload_page.message1') })
    await router.push('/config')
    return false
  }

  if (!repo) {
    ElMessage.error({ message: i18n.global.t('upload_page.message2') })
    await router.push('/config')
    return false
  }

  if (!selectedDir) {
    ElMessage.error({ message: i18n.global.t('upload_page.message3') })
    await router.push('/config')
    return false
  }

  return true
}

export async function beforeUpload<T extends { uploadStatus: { progress: number } }>(
  userConfigInfo: UserConfigInfoModel,
  fileList: T[]
) {
  if (!validateConfig(userConfigInfo)) {
    return []
  }

  const notYetUploadList = fileList.filter((x) => x.uploadStatus.progress === 0)

  if (notYetUploadList.length === 0) {
    ElMessage.error({ message: i18n.global.t('upload_page.message4') })
    return []
  }

  return notYetUploadList
}

/**
 * 上传多个视频到 GitHub 仓库
 * @param userConfigInfo
 * @param imgs
 */
export async function uploadVideosToGitHub(
  userConfigInfo: UserConfigInfoModel,
  videos: UploadVideoModel[]
): Promise<boolean> {
  const { branch, repo, selectedDir, owner } = userConfigInfo

  const blobs = []
  // eslint-disable-next-line no-restricted-syntax
  for (const video of videos) {
    video.uploadStatus.uploading = true
    const tempBase64 = (
      video.base64.compressBase64 ||
      video.base64.watermarkBase64 ||
      video.base64.originalBase64
    ).split(',')[1]
    // 上传图片文件，为仓库创建 blobs
    const blobRes = await getFileBlob(tempBase64, owner, repo)
    if (blobRes) {
      blobs.push({ video, ...blobRes })
    } else {
      video.uploadStatus.uploading = false
      ElMessage.error(i18n.global.t('upload_page.tip_11', { name: video.filename.final }))
    }
  }

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const branchRes: any = await getBranchInfo(owner, repo, branch)
  if (!branchRes) {
    return Promise.resolve(false)
  }

  const finalPath = selectedDir === '/' ? '' : `${selectedDir}/`

  // 创建 tree
  const treeRes = await createTree(
    owner,
    repo,
    blobs.map((x: any) => ({
      sha: x.sha,
      path: `${finalPath}${x.video.filename.final}`
    })),
    branchRes
  )
  if (!treeRes) {
    return Promise.resolve(false)
  }

  // 创建 commit 节点
  const commitRes: any = await createCommit(
    owner,
    repo,
    treeRes,
    branchRes,
    PICX_UPLOAD_VIDEOS_DESC
  )
  if (!commitRes) {
    return Promise.resolve(false)
  }

  // 将当前分支 ref 指向新创建的 commit
  const refRes = await createRef(owner, repo, branch, commitRes.sha)
  if (!refRes) {
    return Promise.resolve(false)
  }

  blobs.forEach((blob: any) => {
    const name = blob.video.filename.final
    videoUploadedHandle(
      { name, sha: blob.sha, path: `${finalPath}${name}`, size: 0 },
      blob.video,
      userConfigInfo
    )
  })
  return Promise.resolve(true)
}
