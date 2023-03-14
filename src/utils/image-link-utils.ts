import {
  ImageLinkFormatModel,
  ImageLinkRuleModel,
  UploadedImageModel,
  UserConfigInfoModel,
  UserSettingsModel
} from '@/common/model'
import { copyText } from '@/utils'

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
  const selectedType = userSettings.imageLinkType.selected
  const rule = userSettings.imageLinkType.presetList.find(
    (x: ImageLinkRuleModel) => x.name === selectedType
  )?.rule
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
  if (userSettings.enableImageLinkFormat) {
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
      if (autoCopy) {
        ElMessage.success({ message: '该图片链接已自动复制到系统剪贴板', duration: 6000 })
      } else {
        ElMessage.success(`${userSettings.imageLinkType.selected} 图片链接复制成功`)
      }
    })
  } else {
    ElMessage.error(`复制失败`)
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
      if (autoCopy) {
        ElMessage.success({
          message: `已成功将 ${uploadedImgList.length} 张图片链接复制到系统剪贴板`,
          duration: 6000
        })
      } else {
        ElMessage.success(`批量复制图片链接成功`)
      }
    })
  } else {
    console.warn('请先选择图片')
  }
}
