const uploadUrlHandle = (config, filename) => {
  let path = ''
  if (config.selectedDir !== '/') {
    path = config.selectedDir + '/'
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}
export default uploadUrlHandle
