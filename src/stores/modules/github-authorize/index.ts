import { Module } from 'vuex'
import RootStateTypes from '@/stores/types'
import GitHubAuthorizeStateTypes, { GitHubAuthorizationInfo } from './types'
import { deepAssignObject, getLocal, setLocal } from '@/utils'
import { LS_AUTHORIZATION } from '@/common/constant'

const initAuthorizationInfo = (): GitHubAuthorizationInfo => {
  const initInfo: GitHubAuthorizationInfo = {
    authorized: false,
    installed: null,
    token: '',
    tokenCreateTime: 0,
    code: '',
    codeCreateTime: 0,
    installationId: '',
    manualToken: '',
    isAutoAuthorize: false,
    authorizing: false
  }

  const LSInfo = getLocal(LS_AUTHORIZATION)

  if (LSInfo) {
    deepAssignObject(initInfo, LSInfo)
    return initInfo
  }

  return initInfo
}

const githubAuthorizeModule: Module<GitHubAuthorizeStateTypes, RootStateTypes> = {
  state: {
    authorizationInfo: initAuthorizationInfo()
  },

  actions: {
    // 设置 GitHub APP 授权状态信息
    SET_GITHUB_AUTHORIZATION_INFO({ state, dispatch }, authorizationInfo: GitHubAuthorizationInfo) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in authorizationInfo) {
        if (Object.hasOwn(state.authorizationInfo, key)) {
          // @ts-ignore
          state.authorizationInfo[key] = authorizationInfo[key]
        }
      }
      dispatch('GITHUB_AUTHORIZATION_INFO_PERSIST')
    },

    // 持久化存储 GitHub APP 授权状态信息
    GITHUB_AUTHORIZATION_INFO_PERSIST({ state }) {
      setLocal(LS_AUTHORIZATION, state.authorizationInfo)
    }
  },

  getters: {
    getGitHubAuthorizationInfo: (state) => state.authorizationInfo
  }
}

export default githubAuthorizeModule
