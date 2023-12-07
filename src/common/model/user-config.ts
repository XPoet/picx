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
  // eslint-disable-next-line no-unused-vars
  newBranch = 'newBranch', // 新建分支
  // eslint-disable-next-line no-unused-vars
  repoBranch = 'repoBranch' // 仓库分支
}

export interface DirModel {
  value: string
  label: string
}

export enum DirModeEnum {
  // eslint-disable-next-line no-unused-vars
  autoDir = 'autoDir', // 自动目录
  // eslint-disable-next-line no-unused-vars
  newDir = 'newDir', // 新建目录
  // eslint-disable-next-line no-unused-vars
  rootDir = 'rootDir', // 根目录
  // eslint-disable-next-line no-unused-vars
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
  cache?: any
}
