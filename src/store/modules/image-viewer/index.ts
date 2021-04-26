import { Module } from 'vuex'
import ImageViewerStateTypes from './types'
import RootStateTypes from '../../types'

const imageViewerModule: Module<ImageViewerStateTypes, RootStateTypes> = {
  state: {
    imageViewer: {
      url: '',
      isShow: false
    }
  },
  mutations: {
    IMAGE_VIEWER(state: ImageViewerStateTypes, { url, isShow }) {
      state.imageViewer.url = url
      state.imageViewer.isShow = isShow
    },

    IMAGE_VIEWER_LOGOUT(state: ImageViewerStateTypes) {
      state.imageViewer.isShow = false
      state.imageViewer.url = ''
    }
  },
  actions: {},
  getters: {
    getImageViewer: (state: ImageViewerStateTypes) => state.imageViewer
  }
}

export default imageViewerModule
