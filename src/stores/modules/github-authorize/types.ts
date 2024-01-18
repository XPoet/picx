export interface GitHubAuthorizationInfo {
  authorized: boolean
  token: string
  tokenCreateTime: number
  code: string
  codeCreateTime: number
  installed: boolean | null
  installationId: string
  manualToken: string
  isAutoAuthorize: boolean
  authorizing: boolean
}

export default interface GitHubAuthorizeStateTypes {
  authorizationInfo: GitHubAuthorizationInfo
}
