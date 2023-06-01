import { Module } from 'vuex'
import UploadAreaActiveStateTypes from './types'
import RootStateTypes from '../../types'

const uploadAreaActiveModule: Module<UploadAreaActiveStateTypes, RootStateTypes> = {
  state: {
    uploadAreaActive: false
  },
  mutations: {
    // 修改上传区域激活状态
    CHANGE_UPLOAD_AREA_ACTIVE(state: UploadAreaActiveStateTypes, isActive: boolean) {
      state.uploadAreaActive = isActive
    },

    UPLOAD_AREA_ACTIVE_LOGOUT(state: UploadAreaActiveStateTypes) {
      state.uploadAreaActive = false
    }
  },
  getters: {
    getUploadAreaActive: (state: UploadAreaActiveStateTypes) => state.uploadAreaActive
  }
}

export default uploadAreaActiveModule
