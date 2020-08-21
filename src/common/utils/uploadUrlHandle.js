const uploadUrlHandle = (config, filename) => {

  const baseUrl = 'https://api.github.com/repos'

  let path = config.selectedDir + '/'

  if (config.dirMode === 'nonuseDir') {
    path = ''
  }

  return `${baseUrl}/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`

}

export default uploadUrlHandle
