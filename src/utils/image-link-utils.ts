import {
  ImageLinkRuleModel,
  UploadedImageModel,
  UserConfigInfoModel,
  UserSettingsModel
} from '@/common/model'
import { copyText } from '@/utils'

/**
 * 生成一个图片链接
 * @param imgPath
 * @param imageLinkType
 * @param userConfigInfo
 */
export const generateImageLinks = (
  imgPath: string,
  imageLinkType: UserSettingsModel['imageLinkType'],
  userConfigInfo: UserConfigInfoModel
): string | null => {
  const selectedType = imageLinkType.selected
  const rule = imageLinkType.presetList.find(
    (x: ImageLinkRuleModel) => x.name === selectedType
  )?.rule
  if (rule) {
    const { owner, selectedRepo: repo, selectedBranch: branch } = userConfigInfo
    return rule
      .replaceAll('{{owner}}', owner)
      .replaceAll('{{repo}}', repo)
      .replaceAll('{{branch}}', branch)
      .replaceAll('{{path}}', imgPath)
  }
  return null
}

/**
 * 复制单张图片链接
 * @param imgPath
 * @param imageLinkType
 * @param userConfigInfo
 * @param autoCopy
 */
export const copyImageLink = (
  imgPath: string,
  imageLinkType: UserSettingsModel['imageLinkType'],
  userConfigInfo: UserConfigInfoModel,
  autoCopy: boolean = false
) => {
  const link = generateImageLinks(imgPath, imageLinkType, userConfigInfo)
  if (link) {
    copyText(link, () => {
      if (autoCopy) {
        ElMessage.success({ message: '该图片链接已自动复制到系统剪贴板', duration: 3500 })
      } else {
        ElMessage.success(`${imageLinkType.selected} CDN 图片链接复制成功`)
      }
    })
  } else {
    ElMessage.error(`复制失败`)
  }
}

/**
 * 批量复制图片外链
 * @param uploadedImgList 图片对象列表
 * @param imageLinkType
 * @param userConfigInfo
 * @param autoCopy
 */
export const batchCopyImageLinks = (
  uploadedImgList: Array<UploadedImageModel>,
  imageLinkType: UserSettingsModel['imageLinkType'],
  userConfigInfo: UserConfigInfoModel,
  autoCopy: boolean = false
) => {
  if (uploadedImgList?.length > 0) {
    let linksTxt = ''
    uploadedImgList.forEach((item: UploadedImageModel, index) => {
      const link = generateImageLinks(item.path, imageLinkType, userConfigInfo)
      linksTxt += `${link}${index < uploadedImgList.length - 1 ? '\n' : ''}`
    })
    copyText(linksTxt, () => {
      if (autoCopy) {
        ElMessage.success({
          message: `已成功将 ${uploadedImgList.length} 张图片链接复制到系统剪贴板`,
          duration: 3500
        })
      } else {
        ElMessage.success(`批量复制图片链接成功`)
      }
    })
  } else {
    console.warn('请先选择图片')
  }
}
