import {hashFilenameHandle} from "@/common/utils/fileHandleHelper";

const generateExternalLink = (type, content, config) => {

  const cdnLink = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.selectedRepos}@${config.selectedBranch}/${content['path']}`
  const ghLink = decodeURI(content['download_url'])

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
