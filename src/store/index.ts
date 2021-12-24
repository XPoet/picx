import { InjectionKey } from 'vue'
import { createStore, Store, useStore as baseUseStore } from 'vuex'
import RootStateTypes, { AllStateTypes } from './types'
import dirImageListModule from './modules/dir-image-list'
import toUploadImageModule from './modules/to-upload-image'
import uploadedImageListModule from './modules/uploaded-image-list'
import userConfigInfoModule from './modules/user-config-info'
import imageViewerModule from './modules/image-viewer'
import imageCardModule from './modules/image-card'
import uploadAreaActiveModule from './modules/upload-area-active'
import uploadSettingsModule from './modules/upload-settings'
import userSettingsModule from './modules/user-settings'

// Create a new store instance.
export const store = createStore<RootStateTypes>({
  modules: {
    dirImageListModule,
    toUploadImageModule,
    uploadedImageListModule,
    userConfigInfoModule,
    imageViewerModule,
    imageCardModule,
    uploadAreaActiveModule,
    uploadSettingsModule,
    userSettingsModule
  },

  state: {
    rootName: 'root'
  },

  mutations: {},

  actions: {
    // 退出登录（删除 localStorage 和 sessionStorage 数据，清空 state 的值）
    LOGOUT({ dispatch, commit }) {
      dispatch('DIR_IMAGE_LOGOUT')
      dispatch('TO_UPLOAD_IMAGE_LOGOUT')
      dispatch('UPLOADED_LIST_LOGOUT')
      dispatch('USER_CONFIG_INFO_LOGOUT')
      commit('IMAGE_VIEWER_LOGOUT')
      commit('UPLOAD_AREA_ACTIVE_LOGOUT')
      commit('UPLOAD_SETTINGS_LOGOUT')
      dispatch('USER_SETTINGS_LOGOUT')
      localStorage.clear()
      sessionStorage.clear()
    }
  },

  getters: {}
})

export const key: InjectionKey<Store<RootStateTypes>> = Symbol('vuex-store')

export function useStore<T = AllStateTypes>() {
  return baseUseStore<T>(key)
}
