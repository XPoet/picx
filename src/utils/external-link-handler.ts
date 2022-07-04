import ExternalLinkType from '@/common/model/external-link.model'
import { UserConfigInfoModel } from '@/common/model/user-config-info.model'
import { getFilename } from '@/utils/file-handle-helper'
import { UploadedImageModel } from '@/common/model/upload.model'

/**
 * 创建承载图片外链文本的 DOM 元素
 */
export const createExternalLinkDom = () => {
  let externalLinkDom: any = document.querySelector('.temp-external-link-txt')
  if (!externalLinkDom) {
    externalLinkDom = document.createElement('textarea')
    externalLinkDom.setAttribute('class', 'temp-external-link-txt')
    externalLinkDom.style.position = 'absolute'
    externalLinkDom.style.top = '-99999rem'
    externalLinkDom.style.left = '-99999rem'
    document.body.appendChild(externalLinkDom)
  }
  return externalLinkDom
}

/**
 * 生成图片外链
 * @param type
 * @param content
 * @param config
 */
export const generateExternalLink = (
  type: ExternalLinkType,
  content: any,
  config: UserConfigInfoModel
): string => {
  const staticalyLink: string = `https://cdn.staticaly.com/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content.path}`
  const cloudflareLink: string = `https://git.poker/${config.owner}/${config.selectedRepos}/blob/${config.selectedBranch}/${content.path}?raw=true`
  const jsdelivrLink: string = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content.path}`
  const githubLink: string = decodeURI(content.download_url)

  // eslint-disable-next-line default-case
  switch (type) {
    case ExternalLinkType.staticaly:
      return staticalyLink

    case ExternalLinkType.cloudflare:
      return cloudflareLink

    case ExternalLinkType.jsdelivr:
      return jsdelivrLink

    case ExternalLinkType.github:
      return githubLink

    default:
      return githubLink
  }
}

/**
 * 图片外链转换为 Markdown 格式
 * @param name 图片名
 * @param url 图片外链
 */
export const formatMarkdown = (name: string, url: string): string => {
  return `![${getFilename(name)}](${url})`
}

/**
 * 复制图片外链
 * @param img 图片对象
 * @param type CDN 类型
 */
export const copyExternalLink = (img: UploadedImageModel, type: ExternalLinkType) => {
  let externalLink = ''
  let successInfo = ''
  const { name, is_transform_md: isMD } = img

  switch (type) {
    case ExternalLinkType.jsdelivr:
      if (isMD) {
        externalLink = formatMarkdown(name, img.jsdelivr_cdn_url)
        successInfo = 'Markdown 格式的 jsDelivr CDN'
      } else {
        externalLink = img.jsdelivr_cdn_url
        successInfo = 'jsDelivr CDN'
      }
      break

    case ExternalLinkType.staticaly:
      if (isMD) {
        externalLink = formatMarkdown(name, img.staticaly_cdn_url)
        successInfo = 'Markdown 格式的 Staticaly CDN'
      } else {
        externalLink = img.staticaly_cdn_url
        successInfo = 'Staticaly CDN'
      }
      break

    case ExternalLinkType.cloudflare:
      if (isMD) {
        externalLink = formatMarkdown(name, img.cloudflare_cdn_url)
        successInfo = 'Markdown 格式的 Cloudflare CDN'
      } else {
        externalLink = img.cloudflare_cdn_url
        successInfo = 'Cloudflare CDN'
      }
      break

    default:
      if (isMD) {
        externalLink = formatMarkdown(name, img.github_url)
        successInfo = 'Markdown 格式的 GitHub'
      } else {
        externalLink = img.github_url
        successInfo = 'GitHub'
      }
  }

  const externalLinkDom: any = createExternalLinkDom()

  externalLinkDom.value = externalLink
  externalLinkDom.select()
  document.execCommand('copy')
  ElMessage.success(`${successInfo} 外链复制成功！`)
}

/**
 * 批量复制图片外链
 * @param imgCardList 图片列表
 * @param type 当前选择的外链类型
 */
export const batchCopyExternalLink = (
  imgCardList: Array<UploadedImageModel>,
  type: ExternalLinkType
) => {
  let externalLink = ''
  const externalLinkDom: any = createExternalLinkDom()
  externalLinkDom.value = ''
  if (imgCardList?.length > 0) {
    imgCardList.forEach((item: UploadedImageModel, index) => {
      const isMD = item.is_transform_md
      switch (type) {
        case ExternalLinkType.jsdelivr:
          externalLink = isMD
            ? formatMarkdown(item.name, item.jsdelivr_cdn_url)
            : item.jsdelivr_cdn_url
          break

        case ExternalLinkType.staticaly:
          externalLink = isMD
            ? formatMarkdown(item.name, item.staticaly_cdn_url)
            : item.staticaly_cdn_url
          break

        case ExternalLinkType.cloudflare:
          externalLink = isMD
            ? formatMarkdown(item.name, item.cloudflare_cdn_url)
            : item.cloudflare_cdn_url
          break

        default:
          externalLink = isMD
            ? formatMarkdown(item.name, item.github_url)
            : item.github_url
      }

      if (index < imgCardList.length - 1) {
        // eslint-disable-next-line prefer-template
        externalLinkDom.value += externalLink + '\n'
      } else {
        externalLinkDom.value += externalLink
      }
    })
    externalLinkDom.select()
    document.execCommand('copy')
    ElMessage.success(`批量复制图片链接成功`)
  } else {
    console.warn('请先选择图片')
  }
}
