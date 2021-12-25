import { DirModeEnum, DirModel } from './dir.model'

export interface ReposModel {
  value: string
  label: string
  desc?: string
}

export interface BranchModel {
  value: string
  label: string
}

export enum BranchModeEnum {
  newBranch = 'newBranch',
  reposBranch = 'reposBranch'
}

export interface UserConfigInfoModel {
  token: string
  owner: string
  email: string
  name: string
  avatarUrl: string
  selectedRepos: string
  reposList: ReposModel[]
  selectedBranch: string
  branchMode: BranchModeEnum
  branchList: BranchModel[]
  dirMode: DirModeEnum
  selectedDir: string
  selectedDirList: string[]
  dirList: DirModel[]
  loggingStatus: boolean
}
