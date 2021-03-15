import { createStore } from 'vuex'
import toUploadImage from './modules/to-upload-image'
import uploadedImageList from './modules/uploaded-image-list'
import dirImageList from './modules/dir-image-list'
import userConfigInfo from './modules/user-config-info'

// Create a new store instance.
export default createStore({
  modules: {
    toUploadImage,
    uploadedImageList,
    dirImageList,
    userConfigInfo,
  },

  state() {
    return {
      imageViewer: {
        url: '',
        isShow: false
      },
      uploadAreaActive: false,
      uploadSettings: {
        isSetMaxSize: false,
        compressSize: 200
      }
    }
  },

  mutations: {
    // 大图查看
    IMAGE_VIEWER(state, {url, isShow}) {
      state.imageViewer.url = url
      state.imageViewer.isShow = isShow
    },

    // 修改上传区域激活状态
    CHANGE_UPLOAD_AREA_ACTIVE(state, isActive) {
      state.uploadAreaActive = isActive
    }
  },

  actions: {
    // 退出登录（删除 localStorage 和 sessionStorage 数据，清空 state 的值）
    LOGOUT({ state, dispatch }) {
      state.uploadAreaActive = false
      state.imageViewer.isShow = false
      state.imageViewer.url = ''
      dispatch('DIR_IMAGE_LOGOUT')
      dispatch('TO_UPLOAD_IMAGE_LOGOUT')
      dispatch('UPLOADED_LIST_LOGOUT')
      dispatch('USER_CONFIG_INFO_LOGOUT')
    },
  },

  getters: {
    getImageViewer: (state: any) => state.imageViewer,
    getUploadAreaActive: state => state.uploadAreaActive,
    getUploadSettings: state => state.uploadSettings,
  }
})
