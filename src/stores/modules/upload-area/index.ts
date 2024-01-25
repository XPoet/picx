import { Module } from 'vuex'
import UploadAreaStateTypes from './types'
import RootStateTypes from '../../types'

const uploadAreaModule: Module<UploadAreaStateTypes, RootStateTypes> = {
  state: {
    isActive: false,
    isPaste: false,
    pressShiftKey: false,
    activeInfo: null
  },
  mutations: {
    SET_UPLOAD_AREA_STATE(state: UploadAreaStateTypes, info: any) {
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
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
    }
  },
  getters: {
    getUploadAreaState: (state: UploadAreaStateTypes) => state
  }
}

export default uploadAreaModule
