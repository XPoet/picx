import Vue from 'vue'
import Vuex from 'vuex'
import {
  PICX_CONFIG,
  PICX_MANAGEMENT,
  PICX_UPLOADED
} from "@/common/model/localStorage";
import cleanObject from "@/common/utils/cleanObject";

Vue.use(Vuex)

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

export default new Vuex.Store({
  state: {
    userConfigInfo: initUserConfigInfo(),
    dirImageList: initDirImageList(),
    uploadedImageList: initUploadedImageList(),
    imageViewer: {
      url: '',
      isShow: false
    },
    uploadAreaActive: false
  },
  mutations: {

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
      if (!state.userConfigInfo.dirList.some(v => v.value === dir)) {
        state.userConfigInfo.dirList.push({label: dir, value: dir})
        this.commit('PERSIST_USER_CONFIG_INFO')
      }
    },

    // 用户配置信息 - 删除目录列表的某个目录
    USER_CONFIG_INFO_REMOVE_DIR(state, dir) {
      const dirList = state.userConfigInfo.dirList
      if (dirList.some(v => v.value === dir)) {
        const rmIndex = dirList.findIndex(v => v.value === dir)
        dirList.splice(rmIndex, 1)
        this.commit('PERSIST_USER_CONFIG_INFO')
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

  getters: {
    getUserConfigInfo: state => state.userConfigInfo,
    getUserAvatar: state => state.userConfigInfo.avatarUrl,
    getUserName: state => state.userConfigInfo.name,
    getUserLoggingStatus: state => state.userConfigInfo.loggingStatus,
    getDirImageList: state => state.dirImageList,
    getUploadedImageList: state => state.uploadedImageList,
    getImageViewer: state => state.imageViewer,
    getUploadAreaActive: state => state.uploadAreaActive,
  },

  actions: {
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

    // =========================================================
    // 图床管理 - 增加图片
    DIR_IMAGE_LIST_ADD_IMAGE({state, dispatch}, item) {
      const temp = state.dirImageList.find(v => v.dir === item.dir)
      if (temp) {
        temp.imageList.push(item)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 往指定目录增加图片列表
    DIR_IMAGE_LIST_ADD_IMAGE_LIST({state, dispatch}, dirImageItem) {

      const temp = state.dirImageList.find(v => v.dir === dirImageItem.dir)

      if (temp) {
        temp.imageList = dirImageItem.imageList
      } else {
        state.dirImageList.push(dirImageItem)
      }

      dispatch('DIR_IMAGE_LIST_PERSIST')

    },

    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR({state, dispatch}, dir) {
      if (!state.dirImageList.some(v => v.dir === dir)) {
        const dirObj = {dir: dir, imageList: []}

        if (dir === '/') {
          state.dirImageList.unshift(dirObj)
        } else {
          state.dirImageList.push(dirObj)
        }
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除目录
    DIR_IMAGE_LIST_REMOVE_DIR({state, dispatch}, dir) {
      if (state.dirImageList.some(v => v.dir === dir)) {
        const rmIndex = state.dirImageList.findIndex(v => v.dir === dir)
        // 删除目录
        state.dirImageList.splice(rmIndex, 1)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除指定目录里的指定图片
    DIR_IMAGE_LIST_REMOVE({state, dispatch, commit}, item) {
      if (state.dirImageList.length > 0) {
        const temp = state.dirImageList.find(v => v.dir === item.dir)
        if (temp) {
          const rmIndex = temp.imageList.findIndex(v => v.uuid === item.uuid)
          if (rmIndex !== -1) {

            // 删除图片
            temp.imageList.splice(rmIndex, 1)

            // 如果 imageList.length 为 0，需删除该目录
            if (temp.imageList.length === 0) {

              // userConfigInfo.dirList 中删除目录
              dispatch('DIR_IMAGE_LIST_REMOVE_DIR', temp.dir)

              // dirImageList 中删除目录
              commit('USER_CONFIG_INFO_REMOVE_DIR', temp.dir)
            }

            dispatch('DIR_IMAGE_LIST_PERSIST')
          }
        }
      }
    },

    // 图床管理 - 持久化存储
    DIR_IMAGE_LIST_PERSIST({state}) {
      localStorage.setItem(PICX_MANAGEMENT, JSON.stringify(state.dirImageList))
    },

    // =========================================================
    // 上传完成的图片列表 - 增加
    UPLOADED_LIST_ADD({state, dispatch}, item) {
      state.uploadedImageList.unshift(item)
      dispatch('UPLOADED_LIST_PERSIST')
    },

    // 上传完成的图片列表 - 删除
    UPLOADED_LIST_REMOVE({state, dispatch}, item) {
      if (state.uploadedImageList.length > 0) {
        const rmIndex = state.uploadedImageList.findIndex(v => v.uuid === item.uuid)
        if (rmIndex !== -1) {
          state.uploadedImageList.splice(rmIndex, 1)
          dispatch('UPLOADED_LIST_PERSIST')
        }
      }
    },

    // 上传完成的图片列表 - 持久化
    UPLOADED_LIST_PERSIST({state}) {
      sessionStorage.setItem(PICX_UPLOADED, JSON.stringify(state.uploadedImageList))
    },
  },
  modules: {}
})
