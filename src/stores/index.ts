import { InjectionKey } from 'vue'
import { createStore, Store, useStore as baseUseStore } from 'vuex'
import RootStateTypes, { AllStateTypes } from './types'
import dirImageListModule from './modules/dir-image-list'
import userConfigInfoModule from './modules/user-config-info'
import imageCardModule from './modules/image-card'
import uploadAreaModule from './modules/upload-area'
import userSettingsModule from './modules/user-settings'
import toolboxImageListModule from './modules/toolbox-image-list'
import uploadImageListModule from './modules/upload-image-list'
import githubAuthorizeModule from './modules/github-authorize'
import deployStatusModule from './modules/deploy-status'

// Create a new store instance
export const store = createStore<RootStateTypes>({
  modules: {
    dirImageListModule,
    userConfigInfoModule,
    imageCardModule,
    uploadAreaModule,
    userSettingsModule,
    toolboxImageListModule,
    uploadImageListModule,
    githubAuthorizeModule,
    deployStatusModule
  },
  state: {
    rootName: 'root'
  },
  actions: {
    // 退出登录（删除 localStorage 和 sessionStorage 数据，清空 state 的值）
    LOGOUT({ dispatch, commit }) {
      commit('UPLOAD_AREA_ACTIVE_LOGOUT')
      dispatch('DIR_IMAGE_LOGOUT')
      dispatch('USER_CONFIG_INFO_LOGOUT')
      dispatch('USER_SETTINGS_LOGOUT')
      dispatch('TOOLBOX_IMG_LIST_RESET')
      dispatch('UPLOAD_IMG_LIST_RESET')
      localStorage.clear()
      sessionStorage.clear()
    }
  }
})

export const key: InjectionKey<Store<RootStateTypes>> = Symbol('vuex-store')

export function useStore<T = AllStateTypes>() {
  return baseUseStore<T>(key)
}
