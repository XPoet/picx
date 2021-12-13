import { getFilename } from './file-handle-helper'
import { ExternalLinkType } from '../model/externalLink.model'
import { UserConfigInfoModel } from '../model/user-config-info.model'

const generateExternalLink = (
  type: ExternalLinkType,
  content: any,
  config: UserConfigInfoModel
  // eslint-disable-next-line consistent-return
): string => {
  const cdnLink: string = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content.path}`
  const ghLink: string = decodeURI(content.download_url)

  // eslint-disable-next-line default-case
  switch (type) {
    case ExternalLinkType.gh:
      return ghLink

    case ExternalLinkType.md_gh:
      return `![${getFilename(content.name)}](${ghLink})`

    case ExternalLinkType.cdn:
      return cdnLink

    case ExternalLinkType.md_cdn:
      return `![${getFilename(content.name)}](${cdnLink})`
  }
}

export default generateExternalLink
