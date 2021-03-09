const uploadUrlHandle = (config: any, filename: any): string => {
  let path = ''
  if (config.selectedDir !== '/') {
    path = config.selectedDir + '/'
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}
export default uploadUrlHandle
