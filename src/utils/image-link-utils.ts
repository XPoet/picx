import {
  ImageLinkFormatModel,
  UploadedImageModel,
  UserConfigInfoModel,
  UserSettingsModel
} from '@/common/model'
import { copyText } from '@/utils'
import i18n from '@/plugins/vue/i18n'

/**
 * 生成一个图片链接
 * @param imageObj
 * @param userConfigInfo
 * @param userSettings
 */
export const generateImageLinks = (
  imageObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel,
  userSettings: UserSettingsModel
): string | null => {
  const { selected } = userSettings.imageLinkType
  const { rule } = userSettings.imageLinkType.presetList[selected]
  if (rule) {
    const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo
    return rule
      .replaceAll('{{owner}}', owner)
      .replaceAll('{{repo}}', repo)
      .replaceAll('{{branch}}', branch)
      .replaceAll('{{path}}', imageObj.path)
  }
  return null
}

/**
 * 转换图片链接格式
 * @param imageLink
 * @param imageName
 * @param userSettings
 */
const transformImageLink = (
  imageLink: string | null,
  imageName: string,
  userSettings: UserSettingsModel
) => {
  if (userSettings.imageLinkFormat.enable) {
    const selectedFormat = userSettings.imageLinkFormat.selected
    const format = userSettings.imageLinkFormat.presetList.find(
      (x: ImageLinkFormatModel) => x.name === selectedFormat
    )?.format
    if (format) {
      return format
        .replaceAll('imageLink', imageLink || '')
        .replaceAll('imageName', imageName.split('.')[0])
    }
  }
  return imageLink
}

const copyMessage = (autoCopy = false) => {
  const message: string = autoCopy
    ? i18n.global.t('copy_success_1')
    : i18n.global.t('copy_success_2')

  ElMessage({
    type: autoCopy ? 'info' : 'success',
    message,
    duration: autoCopy ? 6000 : 4000
  })
}

/**
 * 复制单张图片链接
 * @param imgObj
 * @param userConfigInfo
 * @param userSettings
 * @param autoCopy
 */
export const copyImageLink = (
  imgObj: UploadedImageModel,
  userConfigInfo: UserConfigInfoModel,
  userSettings: UserSettingsModel,
  autoCopy: boolean = false
) => {
  const link = transformImageLink(
    generateImageLinks(imgObj, userConfigInfo, userSettings),
    imgObj.name,
    userSettings
  )
  if (link) {
    copyText(link, () => {
      copyMessage(autoCopy)
    })
  } else {
    ElMessage.error({ message: i18n.global.t('copy_fail_1') })
  }
}

/**
 * 批量复制图片链接
 * @param uploadedImgList 图片对象列表
 * @param userConfigInfo
 * @param userSettings
 * @param autoCopy
 */
export const batchCopyImageLinks = (
  uploadedImgList: Array<UploadedImageModel>,
  userConfigInfo: UserConfigInfoModel,
  userSettings: UserSettingsModel,
  autoCopy: boolean = false
) => {
  if (uploadedImgList?.length > 0) {
    let linksTxt = ''
    uploadedImgList.forEach((img: UploadedImageModel, index) => {
      const link = transformImageLink(
        generateImageLinks(img, userConfigInfo, userSettings),
        img.name,
        userSettings
      )
      linksTxt += `${link}${index < uploadedImgList.length - 1 ? '\n' : ''}`
    })
    copyText(linksTxt, () => {
      copyMessage(autoCopy)
    })
  }
}
