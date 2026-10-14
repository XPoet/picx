import type { Module } from 'vuex'
import type RootStateTypes from '../../types'
import type UploadAreaStateTypes from './types'

const uploadAreaModule: Module<UploadAreaStateTypes, RootStateTypes> = {
  state: {
    isActive: false,
    isPaste: false,
    pressShiftKey: false,
    activeInfo: null,
  },
  mutations: {
    SET_UPLOAD_AREA_STATE(state: UploadAreaStateTypes, info: any) {
      for (const key in info) {
        // @ts-ignore
        state[key] = info[key]
      }
    },
    UPLOAD_AREA_ACTIVE_LOGOUT(state: UploadAreaStateTypes) {
      state.isActive = false
      state.isPaste = false
      state.pressShiftKey = false
      state.activeInfo = null
    },
  },
  getters: {
    getUploadAreaState: (state: UploadAreaStateTypes) => state,
  },
}

export default uploadAreaModule
