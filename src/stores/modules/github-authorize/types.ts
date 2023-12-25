export interface GitHubAuthorizationInfo {
  authorized: boolean
  token: string
  tokenCreateTime: number
  code: string
  codeCreateTime: number
  installed: boolean
  installationId: string
  manualToken: string
  isAutoAuthorize: boolean
}

export default interface GitHubAuthorizeStateTypes {
  authorizationInfo: GitHubAuthorizationInfo
}
