export interface DirModel {
  value: string
  label: string
}

export enum DirModeEnum {
  // eslint-disable-next-line no-unused-vars
  rootDir = 'rootDir', // 根目录
  // eslint-disable-next-line no-unused-vars
  dateDir = 'dateDir', // 日期目录
  // eslint-disable-next-line no-unused-vars
  repoDir = 'repoDir', // 仓库目录
  // eslint-disable-next-line no-unused-vars
  newDir = 'newDir' // 新建目录
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
