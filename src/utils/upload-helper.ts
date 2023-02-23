import {
  UserConfigInfoModel,
  ExternalLinkType,
  ToUploadImageModel,
  UploadedImageModel
} from '@/common/model'
import axios from '@/utils/axios'
import { store } from '@/store'
import { generateExternalLink } from '@/utils/external-link-handler'

export const uploadUrlHandle = (
  config: UserConfigInfoModel,
  filename: string
): string => {
  let path = ''
  if (config.selectedDir !== '/') {
    path = `${config.selectedDir}/`
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}

export async function uploadImages(
  userConfigInfo: UserConfigInfoModel,
  imgs: ToUploadImageModel[]
): Promise<void> {
  const {
    selectedBranch: branch,
    selectedRepos: repo,
    selectedDir,
    owner
  } = userConfigInfo

  imgs.forEach((img) => {
    img.uploadStatus.uploading = true
  })

  // 上传图片文件，为仓库创建blobs
  const blobs = await Promise.all(
    imgs.map((img) => {
      return axios
        .post(`/repos/${owner}/${repo}/git/blobs`, {
          owner,
          repo,
          content: img.imgData.base64Content,
          encoding: 'base64'
        })
        .then((res) => {
          store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          return res
        })
    })
  )
  blobs.forEach((blob, index) => {
    imgs[index].uploadStatus.uploading = false
    if (blob?.status !== 201) {
      throw new Error('上传图片失败')
    }
  })

  // 获取head，用于获取当前分支信息（根目录的tree sha以及head commit sha）
  const head = await axios.get(`/repos/${owner}/${repo}/branches/${branch}`)
  if (head?.status !== 200) {
    throw new Error('获取分支信息失败')
  }

  // 过滤路径多余的斜杠
  const path = selectedDir
    .split('/')
    .filter((item) => item !== '')
    .join('/')
  // 创建tree
  const tree = await axios.post(`/repos/${owner}/${repo}/git/trees`, {
    tree: blobs.map((blob, index) => ({
      path: `${path}/${imgs[index].filename.now}`,
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha
    })),
    base_tree: head.data?.commit?.commit?.tree?.sha || null
  })

  // 创建commit节点
  const commit = await axios.post(`/repos/${owner}/${repo}/git/commits`, {
    tree: tree.data.sha,
    parents: [head.data.commit.sha],
    message: 'Upload picture via PicX(https://github.com/XPoet/picx)'
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

  const basePath = path ? `${path}/` : ''
  imgs.forEach((img, index) => {
    const name = img.filename.now
    const path = basePath + name
    // eslint-disable-next-line no-use-before-define
    uploadedHandle(
      {
        data: {
          content: {
            name,
            path,
            sha: blobs[index].data.sha,
            download_url: `https://github.com/${owner}/${repo}/raw/${branch}/${path}`
          }
        }
      },
      img,
      userConfigInfo
    )
  })
}

export function uploadImage_single(
  userConfigInfo: UserConfigInfoModel,
  img: ToUploadImageModel
): Promise<Boolean> {
  const { selectedBranch, email, owner } = userConfigInfo
  // eslint-disable-next-line no-param-reassign
  img.uploadStatus.uploading = true

  const data: any = {
    message: 'Upload picture via PicX(https://github.com/XPoet/picx)',
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
          // eslint-disable-next-line no-use-before-define
          uploadedHandle(res, img, userConfigInfo)
          store.dispatch('TO_UPLOAD_IMAGE_UPLOADED', img.uuid)
          resolve(true)
        } else {
          // eslint-disable-next-line no-param-reassign
          img.uploadStatus.uploading = false
          resolve(false)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function uploadedHandle(
  res: any,
  img: ToUploadImageModel,
  userConfigInfo: UserConfigInfoModel
) {
  const userSettings = store.getters.getUserSettings

  // 上传状态处理
  // eslint-disable-next-line no-param-reassign
  img.uploadStatus.progress = 100
  // eslint-disable-next-line no-param-reassign
  img.uploadStatus.uploading = false

  // 生成 GitHub 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.github = generateExternalLink(
    ExternalLinkType.github,
    res.data.content,
    userConfigInfo
  )

  // 生成 jsDelivr CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.jsdelivr = generateExternalLink(
    ExternalLinkType.jsdelivr,
    res.data.content,
    userConfigInfo
  )

  // 生成 Staticaly CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.staticaly = generateExternalLink(
    ExternalLinkType.staticaly,
    res.data.content,
    userConfigInfo
  )

  // 生成 zzko CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.zzko = generateExternalLink(
    ExternalLinkType.zzko,
    res.data.content,
    userConfigInfo
  )

  const item: UploadedImageModel = {
    checked: false,
    type: 'image',
    uuid: img.uuid,
    dir: userConfigInfo.selectedDir,
    name: res.data.content.name,
    path: res.data.content.path,
    sha: res.data.content.sha,
    is_transform_md: userSettings.defaultMarkdown,
    deleting: false,
    size: img.fileInfo.size,
    github_url: img.externalLink.github,
    jsdelivr_cdn_url: img.externalLink.jsdelivr,
    staticaly_cdn_url: img.externalLink.staticaly,
    zzko_cdn_url: img.externalLink.zzko
  }

  // eslint-disable-next-line no-param-reassign
  img.uploadedImg = item

  // uploadedList 增加图片
  store.dispatch('UPLOADED_LIST_ADD', item)

  // dirImageList 增加目录
  store.dispatch('DIR_IMAGE_LIST_ADD_DIR', userConfigInfo.selectedDir)

  // dirImageList 增加图片
  store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
}
