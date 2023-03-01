import {
  ExternalLinkType,
  ToUploadImageModel,
  UploadedImageModel,
  UserConfigInfoModel
} from '@/common/model'
import axios from '@/utils/axios'
import { store } from '@/store'
import { generateExternalLink } from '@/utils/external-link-handler'

const uploadedHandle = (
  res: { name: string; sha: string; path: string },
  img: ToUploadImageModel,
  userConfigInfo: UserConfigInfoModel
) => {
  const userSettings = store.getters.getUserSettings

  // 上传状态处理
  img.uploadStatus.progress = 100
  img.uploadStatus.uploading = false

  // 生成 GitHub 外链
  img.externalLink.github = generateExternalLink(ExternalLinkType.github, res.path, userConfigInfo)

  // 生成 jsDelivr CDN 外链
  img.externalLink.jsdelivr = generateExternalLink(
    ExternalLinkType.jsdelivr,
    res.path,
    userConfigInfo
  )

  // 生成 Staticaly CDN 外链
  img.externalLink.staticaly = generateExternalLink(
    ExternalLinkType.staticaly,
    res.path,
    userConfigInfo
  )

  // 生成 zzko CDN 外链
  img.externalLink.zzko = generateExternalLink(ExternalLinkType.zzko, res.path, userConfigInfo)

  const item: UploadedImageModel = {
    checked: false,
    type: 'image',
    uuid: img.uuid,
    dir: userConfigInfo.selectedDir,
    name: res.name,
    sha: res.sha,
    path: res.path,
    is_transform_md: userSettings.defaultMarkdown,
    deleting: false,
    size: img.fileInfo.size,
    github_url: img.externalLink.github,
    jsdelivr_cdn_url: img.externalLink.jsdelivr,
    staticaly_cdn_url: img.externalLink.staticaly,
    zzko_cdn_url: img.externalLink.zzko
  }

  img.uploadedImg = item

  // uploadedList 增加图片
  store.dispatch('UPLOADED_LIST_ADD', item)

  // dirImageList 增加目录
  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', userConfigInfo.selectedDir)

  // dirImageList 增加图片
  store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
}

export const uploadUrlHandle = (config: UserConfigInfoModel, filename: string): string => {
  let path = ''
  if (config.selectedDir !== '/') {
    path = `${config.selectedDir}/`
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}

export async function uploadImagesToGH(
  userConfigInfo: UserConfigInfoModel,
  imgs: ToUploadImageModel[]
): Promise<void> {
  const { selectedBranch: branch, selectedRepos: repo, selectedDir, owner } = userConfigInfo

  imgs.forEach((img) => {
    img.uploadStatus.uploading = true
  })

  // 上传图片文件，为仓库创建 blobs
  let blobs = await Promise.all(
    imgs.map((img) => {
      return axios
        .post(`/repos/${owner}/${repo}/git/blobs`, {
          owner,
          repo,
          content: img.imgData.base64Content,
          encoding: 'base64'
        })
        .then((res) => {
          if (res && res.status === 201) {
            // 已上传数量 +1
            store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          } else {
            img.uploadStatus.uploading = false
            ElMessage.error(`${img.filename.now} 上传失败`)
          }
          return { img, ...res }
        })
    })
  )

  // 获取 head，用于获取当前分支信息（根目录的 tree sha 以及 head commit sha）
  const head = await axios.get(`/repos/${owner}/${repo}/branches/${branch}`)
  if (head?.status !== 200) {
    throw new Error('获取分支信息失败')
  }

  blobs = blobs.filter((x) => x.status === 201)
  const tgtPath = selectedDir === '/' ? '' : `${selectedDir}/`

  // 创建 tree
  const tree = await axios.post(`/repos/${owner}/${repo}/git/trees`, {
    tree: blobs.map((blob) => ({
      path: `${tgtPath}${blob.img.filename.now}`,
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha
    })),
    base_tree: head.data?.commit?.commit?.tree?.sha || null
  })
  if (tree?.status !== 201) {
    throw new Error('创建 tree 失败')
  }

  // 创建 commit 节点
  const commit = await axios.post(`/repos/${owner}/${repo}/git/commits`, {
    tree: tree.data.sha,
    parents: [head.data.commit.sha],
    message: 'Upload images via PicX(https://github.com/XPoet/picx)'
  })
  if (commit?.status !== 201) {
    throw new Error('创建 commit 失败')
  }

  // 将当前分支 ref 指向新创建的 commit
  const refRes = await axios.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.data.sha
  })
  if (refRes?.status !== 200) {
    throw new Error('更新 ref 失败')
  }

  blobs.forEach((blob) => {
    const name = blob.img.filename.now
    uploadedHandle(
      { name, sha: blob.data.sha, path: `${tgtPath}${name}` },
      blob.img,
      userConfigInfo
    )
  })
}

export function uploadImageToGH(
  userConfigInfo: UserConfigInfoModel,
  img: ToUploadImageModel
): Promise<Boolean> {
  const { selectedBranch, email, owner } = userConfigInfo
  img.uploadStatus.uploading = true

  const data: any = {
    message: 'Upload image via PicX(https://github.com/XPoet/picx)',
    branch: selectedBranch,
    content: img.imgData.base64Content
  }

  if (email) {
    data.committer = {
      name: owner,
      email
    }
  }

  return new Promise((resolve, reject) => {
    axios
      .put(uploadUrlHandle(userConfigInfo, img.filename.now), data)
      .then((res) => {
        if (res && res.status === 201) {
          const { name, sha, path } = res.data.content
          uploadedHandle({ name, sha, path }, img, userConfigInfo)
          store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          resolve(true)
        } else {
          img.uploadStatus.uploading = false
          resolve(false)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}
