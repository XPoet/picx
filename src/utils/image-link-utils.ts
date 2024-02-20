import { computed } from 'vue'
import { ImageLinkFormatModel, UploadedImageModel } from '@/common/model'
import { copyText } from '@/utils'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'

/**
 * 生成一个图片链接
 * @param imageObj
 */
export const generateImageLink = (imageObj: UploadedImageModel): string | null => {
  const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
  const userSettings = computed(() => store.getters.getUserSettings).value

  const { selected } = userSettings.imageLinkType
  const { rule } = userSettings.imageLinkType.presetList[selected]
  if (rule) {
    const { owner, repo, branch } = userConfigInfo
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
 */
const transformImageLink = (imageLink: string | null, imageName: string) => {
  const userSettings = computed(() => store.getters.getUserSettings).value
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
 * @param autoCopy
 */
export const copyImageLink = (imgObj: UploadedImageModel, autoCopy: boolean = false) => {
  const link = transformImageLink(generateImageLink(imgObj), imgObj.name)
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
 * @param autoCopy
 */
export const batchCopyImageLinks = (
  uploadedImgList: Array<UploadedImageModel>,
  autoCopy: boolean = false
) => {
  if (uploadedImgList?.length > 0) {
    let linksTxt = ''
    uploadedImgList.forEach((img: UploadedImageModel, index) => {
      const link = transformImageLink(generateImageLink(img), img.name)
      linksTxt += `${link}${index < uploadedImgList.length - 1 ? '\n' : ''}`
    })
    copyText(linksTxt, () => {
      copyMessage(autoCopy)
    })
  }
}
