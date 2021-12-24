import { ElMessage } from 'element-plus'
import { ExternalLinkType } from '../model/externalLink.model'
import { UploadedImageModel } from '@/common/model/upload.model'

// 拷贝批量链接
export default function copyBatchExternalLink(
  imgCardArr: Array<UploadedImageModel>,
  type: ExternalLinkType,
  successInfo: string
) {
  let externalLink = ''
  const externalLinkDom: any = document.querySelector('.temp-batch-externalink')
  externalLinkDom.value = ''
  if (imgCardArr?.length > 0) {
    imgCardArr.forEach((item: UploadedImageModel, index) => {
      const isT = item.is_transform_md
      // eslint-disable-next-line default-case
      switch (type) {
        case ExternalLinkType.gh:
          if (isT) {
            externalLink = item.md_gh_url
          } else {
            externalLink = item.github_url
          }
          break
        case ExternalLinkType.cdn:
          if (isT) {
            externalLink = item.md_cdn_url
          } else {
            externalLink = item.cdn_url
          }
          break
      }
      if (index < imgCardArr.length - 1) {
        // eslint-disable-next-line prefer-template
        externalLinkDom.value += externalLink + '\n'
      } else {
        externalLinkDom.value += externalLink
      }
    })
    externalLinkDom.select()
    document.execCommand('copy')
    ElMessage.success(`${successInfo}`)
  } else {
    console.warn('请先选择图片内容')
  }
}
