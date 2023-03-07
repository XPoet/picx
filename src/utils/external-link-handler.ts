import { computed } from 'vue'
import { ExternalLinkRuleModel, UploadedImageModel } from '@/common/model'
import { store } from '@/store'
import { copyText } from '@/utils/common-utils'

const userSettings = computed(() => store.getters.getUserSettings).value
const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

export const generateImageLinks = (imgPath: string): string | null => {
  const cdnType = userSettings.externalLinkType
  const rule = userSettings.externalLinkTypeList.find(
    (x: ExternalLinkRuleModel) => x.type === cdnType
  )?.rule
  if (rule) {
    const { owner, selectedRepos: repo, selectedBranch: branch } = userConfigInfo
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
 */
export const batchCopyExternalLink = (imgCardList: Array<UploadedImageModel>) => {
  if (imgCardList?.length > 0) {
    let linksTxt = ''
    imgCardList.forEach((item: UploadedImageModel, index) => {
      const link = generateImageLinks(item.path)
      linksTxt += `${link}${index < imgCardList.length - 1 ? '\n' : ''}`
    })
    copyText(linksTxt, () => {
      ElMessage.success(`批量复制图片链接成功`)
    })
  } else {
    console.warn('请先选择图片')
  }
}
