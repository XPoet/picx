import { Module } from 'vuex'
import UploadAreaActiveStateTypes from './types'
import RootStateTypes from '../../types'

const uploadSettingsModule: Module<UploadAreaActiveStateTypes, RootStateTypes> = {
  state: {
    uploadSettings: {
      isSetMaxSize: false,
      compressSize: 200
    }
  },
  mutations: {
    UPLOAD_SETTINGS_LOGOUT(state: UploadAreaActiveStateTypes) {
      state.uploadSettings.isSetMaxSize = false
      state.uploadSettings.compressSize = 200
    }
  },
  actions: {},
  getters: {
    getUploadSettings: (state) => state.uploadSettings
  }
}

export default uploadSettingsModule
