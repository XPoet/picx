import { Module } from 'vuex'
import ImageViewerStateTypes from './types'
import RootStateTypes from '../../types'

const imageViewerModule: Module<ImageViewerStateTypes, RootStateTypes> = {
  state: {
    imageViewer: {
      imgInfo: null,
      isShow: false
    }
  },
  mutations: {
    IMAGE_VIEWER(state: ImageViewerStateTypes, { imgInfo, isShow }) {
      state.imageViewer.imgInfo = imgInfo
      state.imageViewer.isShow = isShow
    },

    IMAGE_VIEWER_LOGOUT(state: ImageViewerStateTypes) {
      state.imageViewer.isShow = false
      state.imageViewer.imgInfo = null
    }
  },
  actions: {},
  getters: {
    getImageViewer: (state: ImageViewerStateTypes) => state.imageViewer
  }
}

export default imageViewerModule
