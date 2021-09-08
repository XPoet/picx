import { Module } from 'vuex'
import UploadAreaActiveStateTypes from './types'
import RootStateTypes from '../../types'

const uploadSettingsModule: Module<UploadAreaActiveStateTypes, RootStateTypes> = {
  state: {
    uploadSettings: {
      isSetMaxSize: true,
      imageMaxSize: 30 * 1024
    }
  },
  mutations: {
    UPLOAD_SETTINGS_LOGOUT(state: UploadAreaActiveStateTypes) {
      state.uploadSettings.isSetMaxSize = true
      state.uploadSettings.imageMaxSize = 50 * 1024
    }
  },
  actions: {},
  getters: {
    getUploadSettings: (state) => state.uploadSettings
  }
}

export default uploadSettingsModule
