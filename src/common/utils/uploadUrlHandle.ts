import { UserConfigInfoModel } from '../model/userConfigInfo.model'

const uploadUrlHandle = (config: UserConfigInfoModel, filename: string): string => {
  let path = ''
  if (config.selectedDir !== '/') {
    path = config.selectedDir + '/'
  }
  return `/repos/${config.owner}/${config.selectedRepos}/contents/${path}${filename}`
}
export default uploadUrlHandle
