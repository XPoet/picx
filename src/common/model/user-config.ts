import { AxiosRequestConfig } from 'axios'

export interface RepoModel {
  value: string
  label: string
  desc?: string
}

export interface BranchModel {
  value: string
  label: string
}

export enum BranchModeEnum {
  newBranch = 'newBranch', // 新建分支
  repoBranch = 'repoBranch' // 窗口分支
}

export interface DirModel {
  value: string
  label: string
}

export enum DirModeEnum {
  autoDir = 'autoDir', // 自动目录
  newDir = 'newDir', // 新建目录
  rootDir = 'rootDir', // 根目录
  repoDir = 'repoDir' // 仓库目录
}

export interface UserConfigInfoModel {
  token: string
  owner: string
  email: string
  name: string
  avatarUrl: string
  selectedRepo: string
  repoList: RepoModel[]
  selectedBranch: string
  branchMode: BranchModeEnum
  branchList: BranchModel[]
  dirMode: DirModeEnum
  viewDir: string
  selectedDir: string
  selectedDirList: string[]
  dirList: DirModel[]
  logined: boolean
}

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  success422?: boolean
  noShowErrorMsg?: boolean
}
