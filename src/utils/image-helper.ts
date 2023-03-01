import { computed } from 'vue'
import { UploadedImageModel, ExternalLinkType } from '@/common/model'
import { getUuid } from '@/utils/common-utils'
import { generateExternalLink } from '@/utils/external-link-handler'
import { store } from '@/store'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

export default function structureImageObject(item: any, selectedDir: string): UploadedImageModel {
  return {
    type: 'image',
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    sha: item.sha,
    path: item.path,
    deleting: false,
    is_transform_md: false,
    size: item.size,
    checked: false,
    github_url: generateExternalLink(ExternalLinkType.github, item.path, userConfigInfo),
    jsdelivr_cdn_url: generateExternalLink(ExternalLinkType.jsdelivr, item.path, userConfigInfo),
    staticaly_cdn_url: generateExternalLink(ExternalLinkType.staticaly, item.path, userConfigInfo),
    zzko_cdn_url: generateExternalLink(ExternalLinkType.zzko, item.path, userConfigInfo)
  }
}
