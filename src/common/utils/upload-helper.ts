import { UserConfigInfoModel } from '@/common/model/user-config-info.model'
import { ToUploadImageModel, UploadedImageModel } from '@/common/model/upload.model'
import axios from '@/common/utils/axios'
import { store } from '@/store'
import generateExternalLink from '@/common/utils/generate-external-link'
import { ExternalLinkType } from '@/common/model/externalLink.model'

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
    message: 'Upload pictures via PicX(https://github.com/XPoet/picx)',
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
    ExternalLinkType.gh,
    res.data.content,
    userConfigInfo
  )

  // 生成 CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.cdn = generateExternalLink(
    ExternalLinkType.cdn,
    res.data.content,
    userConfigInfo
  )

  // 生成 Markdown 格式 GitHub 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.markdown_gh = generateExternalLink(
    ExternalLinkType.md_gh,
    res.data.content,
    userConfigInfo
  )

  // 生成 Markdown 格式 CDN 外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.markdown_cdn = generateExternalLink(
    ExternalLinkType.md_cdn,
    res.data.content,
    userConfigInfo
  )

  const item: UploadedImageModel = {
    uuid: img.uuid,
    dir: userConfigInfo.selectedDir,
    name: res.data.content.name,
    path: res.data.content.path,
    sha: res.data.content.sha,
    github_url: img.externalLink.github,
    cdn_url: img.externalLink.cdn,
    md_gh_url: img.externalLink.markdown_gh,
    md_cdn_url: img.externalLink.markdown_cdn,
    is_transform_md: userSettings.defaultMarkdown,
    deleting: false,
    size: img.fileInfo.size,
    lastModified: img.fileInfo.lastModified
  }

  // eslint-disable-next-line no-param-reassign
  img.uploadedImg = item

  // 如果 userConfigInfo.dirList 不存在该目录，则增加
  if (!userConfigInfo.dirList.some((v: any) => v.value === item.dir)) {
    // userConfigInfo 增加目录
    store.dispatch('USER_CONFIG_INFO_ADD_DIR', item.dir)

    // dirImageList 增加目录
    store.dispatch('DIR_IMAGE_LIST_ADD_DIR', item.dir)
  }

  // uploadedList 增加图片
  store.dispatch('UPLOADED_LIST_ADD', item)

  // dirImageList 增加图片
  store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item)
}
