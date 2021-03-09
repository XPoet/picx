import { createStore } from 'vuex'
import {
  PICX_CONFIG,
  PICX_MANAGEMENT,
  PICX_UPLOADED
} from '../common/model/model'
import cleanObject from "../common/utils/cleanObject"

const initUserConfigInfo = () => {
  let config = localStorage.getItem(PICX_CONFIG)
  return config
    ? JSON.parse(config)
    : {
      token: '',
      owner: '',
      email: '',
      name: '',
      avatarUrl: '',
      selectedRepos: '',
      reposList: [],
      selectedBranch: '',
      dirMode: '',
      selectedDir: '',
      dirList: [],
      loggingStatus: false
    }
}

const initDirImageList = () => {
  let dirImageList = localStorage.getItem(PICX_MANAGEMENT)
  return dirImageList ? JSON.parse(dirImageList) : []
}

const initUploadedImageList = () => {
  let imageList = sessionStorage.getItem(PICX_UPLOADED)
  return imageList ? JSON.parse(imageList) : []
}

const defaultState = {
  count: 0,
  userConfigInfo: initUserConfigInfo(),
  dirImageList: initDirImageList(),
  uploadedImageList: initUploadedImageList(),
  imageViewer: {
    url: '',
    isShow: false
  },
  uploadAreaActive: false
}

// Create a new store instance.
export default createStore({
  state() {
    return defaultState
  },

  mutations: {
    increment(state: typeof defaultState) {
      state.count++
    },

    // 设置用户配置信息
    SET_USER_CONFIG_INFO(state, configInfo) {
      for (const key in configInfo) {
        if (state.userConfigInfo.hasOwnProperty(key)) {
          state.userConfigInfo[key] = configInfo[key]
        }
      }
    },

    // 重置用户配置信息 clean state.userConfigInfo all value
    RESET_USER_CONFIG_INFO(state) {
      cleanObject(state.userConfigInfo)
    },

    // 用户配置信息 - 增加目录
    USER_CONFIG_INFO_ADD_DIR(state, dir) {
      if (!state.userConfigInfo.dirList.some((v: any) => v.value === dir)) {
        state.userConfigInfo.dirList.push({label: dir, value: dir})
        // this.commit('PERSIST_USER_CONFIG_INFO')
      }
    },

    // 用户配置信息 - 删除目录列表的某个目录
    USER_CONFIG_INFO_REMOVE_DIR(state, dir) {
      const dirList = state.userConfigInfo.dirList
      if (dirList.some((v: any) => v.value === dir)) {
        const rmIndex = dirList.findIndex((v: any) => v.value === dir)
        dirList.splice(rmIndex, 1)
        // this.commit('PERSIST_USER_CONFIG_INFO')
      }
    },

    // 持久化用户配置信息
    PERSIST_USER_CONFIG_INFO(state) {
      state.userConfigInfo.selectedDir = state.userConfigInfo.selectedDir.replace(/\s+/g, '-')
      localStorage.setItem(PICX_CONFIG, JSON.stringify(state.userConfigInfo))
    },

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
    increment(context) {
      context.commit('increment')
    },

    // 退出登录（删除 localStorage 和 sessionStorage 数据，清空 state 的值）
    LOGOUT({commit, state}) {
      state.userConfigInfo.loggingStatus = false
      commit('RESET_USER_CONFIG_INFO')
      state.dirImageList = []
      state.uploadedImageList = []
      localStorage.removeItem(PICX_CONFIG)
      localStorage.removeItem(PICX_MANAGEMENT)
      sessionStorage.removeItem(PICX_UPLOADED)
    },
  },
  getters: {
    double(state: typeof defaultState) {
      return 2 * state.count
    },
    getUserConfigInfo: state => state.userConfigInfo,
    getUserAvatar: state => state.userConfigInfo.avatarUrl,
    getUserName: state => state.userConfigInfo.name,
    getUserLoggingStatus: state => state.userConfigInfo.loggingStatus,
    getDirImageList: state => state.dirImageList,
    getUploadedImageList: state => state.uploadedImageList,
    getImageViewer: state => state.imageViewer,
    getUploadAreaActive: state => state.uploadAreaActive,
  },
})
