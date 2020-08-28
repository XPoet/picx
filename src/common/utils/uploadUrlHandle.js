const uploadUrlHandle = (config, filename) => {

  let path = config.selectedDir + '/'

  if (config.dirMode === 'rootDir') {
    path = ''
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}

export default uploadUrlHandle
