import { UserConfigInfoModel } from '@/common/model/user-config-info.model'
import { ToUploadImageModel, UploadedImageModel } from '@/common/model/upload.model'
import axios from '@/utils/axios'
import { store } from '@/store'
import { generateExternalLink } from '@/utils/external-link-handler'
import ExternalLinkType from '@/common/model/external-link.model'

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

  // 生成 Cloudflare CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.cloudflare = generateExternalLink(
    ExternalLinkType.cloudflare,
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
    github_url: img.externalLink.github,
    jsdelivr_cdn_url: img.externalLink.jsdelivr,
    staticaly_cdn_url: img.externalLink.staticaly,
    cloudflare_cdn_url: img.externalLink.cloudflare,
    is_transform_md: userSettings.defaultMarkdown,
    deleting: false,
    size: img.fileInfo.size
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
