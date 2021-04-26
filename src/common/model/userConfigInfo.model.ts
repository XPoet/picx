import { DirModeEnum } from './dir.model'

export interface UserConfigInfoModel {
  token: string
  owner: string
  email: string
  name: string
  avatarUrl: string
  selectedRepos: string
  reposList: any[]
  selectedBranch: string
  dirMode: DirModeEnum
  selectedDir: string
  dirList: any[]
  loggingStatus: boolean
}
