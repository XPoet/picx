const PICX_PREFIX = 'PICX_';

export const PICX_CONFIG = PICX_PREFIX + 'CONFIG'

export const PICX_UPLOADED = PICX_PREFIX + 'UPLOADED'

export const PICX_MANAGEMENT = PICX_PREFIX + 'MANAGEMENT'

export interface UserConfigInfoModel {
  token: string;
  owner: string;
  email: string;
  name: string;
  avatarUrl: string;
  selectedRepos: string;
  reposList: any[];
  selectedBranch: string;
  dirMode: string;
  selectedDir: string;
  dirList: any[];
  loggingStatus: boolean;
}
