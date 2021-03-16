import { hashFilenameHandle } from './fileHandleHelper'
import { ExternalLinkType } from '../model/externalLink.model'
import { UserConfigInfoModel } from '../model/userConfigInfo.model'

const generateExternalLink = (type: ExternalLinkType, content: any, config: UserConfigInfoModel): any => {

  const cdnLink: string = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content['path']}`
  const ghLink: string = decodeURI(content['download_url'])

  switch (type) {
    case ExternalLinkType.gh:
      return ghLink

    case ExternalLinkType.md_gh:
      return `![${hashFilenameHandle(content.name)}](${ghLink})`

    case ExternalLinkType.cdn:
      return cdnLink

    case ExternalLinkType.md_cdn:
      return `![${hashFilenameHandle(content.name)}](${cdnLink})`
  }
}

export default generateExternalLink
