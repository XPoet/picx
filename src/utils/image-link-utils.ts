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
 * 批量复制图片外链
 * @param imgCardList 图片对象列表
 * @param imageLinkType
 * @param userConfigInfo
 */
export const batchCopyImageLinks = (
  imgCardList: Array<UploadedImageModel>,
  imageLinkType: UserSettingsModel['imageLinkType'],
  userConfigInfo: UserConfigInfoModel
) => {
  if (imgCardList?.length > 0) {
    let linksTxt = ''
    imgCardList.forEach((item: UploadedImageModel, index) => {
      const link = generateImageLinks(item.path, imageLinkType, userConfigInfo)
      linksTxt += `${link}${index < imgCardList.length - 1 ? '\n' : ''}`
    })
    copyText(linksTxt, () => {
      ElMessage.success(`批量复制图片链接成功`)
    })
  } else {
    console.warn('请先选择图片')
  }
}
