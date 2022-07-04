import { computed } from 'vue'
import { UploadedImageModel } from '@/common/model/upload.model'
import { getUuid } from '@/utils/common-utils'
import { generateExternalLink } from '@/utils/external-link-handler'
import ExternalLinkType from '@/common/model/external-link.model'
import { store } from '@/store'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

export default function structureImageObject(
  item: any,
  selectedDir: string
): UploadedImageModel {
  return {
    type: 'image',
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    path: item.path,
    sha: item.sha,
    deleting: false,
    is_transform_md: false,
    size: item.size,
    checked: false,
    github_url: generateExternalLink(ExternalLinkType.github, item, userConfigInfo),
    jsdelivr_cdn_url: generateExternalLink(
      ExternalLinkType.jsdelivr,
      item,
      userConfigInfo
    ),
    staticaly_cdn_url: generateExternalLink(
      ExternalLinkType.staticaly,
      item,
      userConfigInfo
    ),
    cloudflare_cdn_url: generateExternalLink(
      ExternalLinkType.cloudflare,
      item,
      userConfigInfo
    )
  }
}
