import { computed } from 'vue'
import { UserConfigInfoModel } from '../model/userConfigInfo.model'
import { ToUploadImageModel, UploadedImageModel } from '../model/upload.model'
import axios from '@/common/utils/axios'
import uploadUrlHandle from '@/common/utils/upload-url-handle'
import generateExternalLink from '@/common/utils/generate-external-link'
import { ExternalLinkType } from '../model/externalLink.model'
import { store } from '../../store/index'
import createToUploadImageObject from '@/common/utils/create-to-upload-image'
import { filenameHandle } from './file-handle-helper'

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
  // 上传状态处理
  // eslint-disable-next-line no-param-reassign
  img.uploadStatus.progress = 100
  // eslint-disable-next-line no-param-reassign
  img.uploadStatus.uploading = false

  // 生成外链
  // eslint-disable-next-line no-param-reassign
  img.externalLink.github = generateExternalLink(
    ExternalLinkType.gh,
    res.data.content,
    userConfigInfo
  )
  // eslint-disable-next-line no-param-reassign
  img.externalLink.cdn = generateExternalLink(
    ExternalLinkType.cdn,
    res.data.content,
    userConfigInfo
  )
  // eslint-disable-next-line no-param-reassign
  img.externalLink.markdown_gh = generateExternalLink(
    ExternalLinkType.md_gh,
    res.data.content,
    userConfigInfo
  )
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
    is_transform_md: userConfigInfo.personalSetting.defaultMarkdown,
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

/**
 *
 * @param url 图片路径
 * @param ext 图片格式
 */
export function getUrlBase64(url: string, ext: string): Promise<string | null> {
  const canvas = document.createElement('canvas') // 创建canvas DOM元素
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = url
  return new Promise((resolve) => {
    img.onload = () => {
      const { width } = img
      const { height } = img
      canvas.width = width // 指定画板的高度,自定义
      canvas.height = height // 指定画板的宽度，自定义
      ctx?.drawImage(img, 0, 0, width, height) // 参数可自定义
      const dataURL: string = canvas.toDataURL(`image/${ext}`)
      resolve(dataURL)
    }
  })
}

// 获取图片对象
export function getImage(base64Data: string, file: any): Promise<Boolean> {
  const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
  const curImg = createToUploadImageObject()

  curImg.imgData.base64Url = base64Data
  // eslint-disable-next-line prefer-destructuring
  curImg.imgData.base64Content = base64Data.split(',')[1]

  const { name, hash, suffix } = filenameHandle(file.name)
  curImg.uuid = hash

  curImg.fileInfo.size = file.size
  curImg.fileInfo.lastModified = file.lastModified

  curImg.filename.name = name
  curImg.filename.hash = hash
  curImg.filename.suffix = suffix
  curImg.filename.now = userConfigInfo.personalSetting.defaultHash
    ? `${name}.${hash}.${suffix}`
    : `${name}.${suffix}`
  curImg.filename.initName = name
  curImg.filename.isHashRename = userConfigInfo.personalSetting.defaultHash

  return new Promise((resolve, reject) => {
    store
      .dispatch('TO_UPLOAD_IMAGE_LIST_ADD', JSON.parse(JSON.stringify(curImg)))
      .then(() => {
        store
          .dispatch('TO_UPLOAD_IMAGE_SET_CURRENT', {
            uuid: hash,
            base64Url: base64Data
          })
          .then(() => {
            resolve(true)
          })
          .catch((error) => {
            reject(error)
          })
      })
  })
}
