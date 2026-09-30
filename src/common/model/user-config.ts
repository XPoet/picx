export interface DirModel {
  value: string
  label: string
}

export enum DirModeEnum {
  rootDir = 'rootDir', // 根目录

  dateDir = 'dateDir', // 日期目录

  repoDir = 'repoDir', // 仓库目录

  newDir = 'newDir', // 新建目录
}

export interface UserConfigInfoModel {
  token: string
  id: string
  owner: string
  email: string
  name: string
  avatarUrl: string
  repo: string
  branch: string
  dirMode: DirModeEnum
  viewDir: string
  selectedDir: string
  selectedDirList: string[]
  dirList: DirModel[]
  logined: boolean
  repoPrivate: boolean
}
