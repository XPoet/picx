import { computed } from 'vue'
import { UploadedImageModel } from '@/common/model/upload.model'
import getUuid from '@/common/utils/get-uuid'
import generateExternalLink from '@/common/utils/generate-external-link'
import { ExternalLinkType } from '@/common/model/externalLink.model'
import { store } from '@/store'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

function structureImageObject(item: any, selectedDir: string): UploadedImageModel {
  return {
    type: 'image',
    uuid: getUuid(),
    dir: selectedDir,
    name: item.name,
    path: item.path,
    sha: item.sha,
    github_url: generateExternalLink(ExternalLinkType.gh, item, userConfigInfo),
    cdn_url: generateExternalLink(ExternalLinkType.cdn, item, userConfigInfo),
    md_gh_url: generateExternalLink(ExternalLinkType.md_gh, item, userConfigInfo),
    md_cdn_url: generateExternalLink(ExternalLinkType.md_cdn, item, userConfigInfo),
    deleting: false,
    is_transform_md: false,
    size: item.size,
    checked: false
  }
}

// eslint-disable-next-line import/prefer-default-export
export { structureImageObject }
