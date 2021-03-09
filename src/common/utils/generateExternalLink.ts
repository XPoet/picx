import { hashFilenameHandle } from "./fileHandleHelper";

const generateExternalLink = (type: any, content: any, config: any): any => {

  const cdnLink: string = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content['path']}`
  const ghLink: string = decodeURI(content['download_url'])

  switch (type) {
    case 'github':
      return ghLink

    case 'markdown_gh':
      return `![${hashFilenameHandle(content.name)}](${ghLink})`

    case 'cdn':
      return cdnLink

    case 'markdown_cdn':
      return `![${hashFilenameHandle(content.name)}](${cdnLink})`
  }
}

export default generateExternalLink
