import { CompressMethod } from '../utils/compress'
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

export type ThemeModeType = 'auto' | 'light' | 'dark'
export type AutoLightThemeDateTyoe = Array<String>
export interface PersonalSetting {
  defaultHash: boolean
  defaultMarkdown: boolean
  themeMode: ThemeModeType
  autoLightThemeDate: AutoLightThemeDateTyoe
  defaultCompress: boolean
  defaultCompressMethod: CompressMethod
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
  dirList: DirModel[]
  loggingStatus: boolean
  personalSetting: PersonalSetting
  elementPlusSize?: 'medium' | 'small' | 'mini'
}
