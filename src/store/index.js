import Vue from 'vue'
import Vuex from 'vuex'
import {PICX_CONFIG, PICX_MANAGEMENT, PICX_UPLOADED} from "../common/model/localStorage";
import {userConfigInfoModel} from "../views/Config/model";
import cleanObject from "../common/utils/cleanObject";

Vue.use(Vuex)

const initUserConfigInfo = () => {
  let config = localStorage.getItem(PICX_CONFIG)
  return config ? JSON.parse(config) : userConfigInfoModel
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

    // 持久化用户配置信息
    PERSIST_USER_CONFIG_INFO(state) {
      localStorage.setItem(PICX_CONFIG, JSON.stringify(state.userConfigInfo))
    },

    // 重置用户配置信息 clean state.userConfigInfo all value
    RESET_USER_CONFIG_INFO(state) {
      cleanObject(state.userConfigInfo)
    },

  },

  getters: {
    getUserConfigInfo: state => state.userConfigInfo,
    getUserAvatar: state => state.userConfigInfo.avatarUrl,
    getUserName: state => state.userConfigInfo.name,
    getUserLoggingStatus: state => state.userConfigInfo.loggingStatus,
    getDirImageList: state => state.dirImageList,
    getUploadedImageList: state => state.uploadedImageList,
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
      if (state.dirImageList.length > 0) {
        state.dirImageList.find(v => v.dir === item.dir).imageList.push(item)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 往指定目录增加图片列表
    DIR_IMAGE_LIST_ADD_IMAGE_LIST({state, dispatch}, dirImageItem) {
      state.dirImageList.find(v => v.dir === dirImageItem.dir).imageList = dirImageItem.imageList
      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR({state, dispatch}, dirItem) {
      if (dirItem.dir === '/') {
        state.dirImageList.unshift(dirItem)
      } else {
        state.dirImageList.push(dirItem)
      }
      dispatch('DIR_IMAGE_LIST_PERSIST')
    },


    // 图床管理 - 删除指定目录里的指定图片
    DIR_IMAGE_LIST_REMOVE({state, dispatch}, item) {
      if (state.dirImageList.length > 0) {
        const temp = state.dirImageList.find(v => v.dir === item.dir)
        console.log('temp: ', temp);
        if (temp) {

          console.log('temp.imageList: ', temp.imageList);
          const rmIndex = temp.imageList.findIndex(v => v.sha === item.sha)

          console.log('rmIndex: ', rmIndex);

          if (rmIndex !== -1) {
            temp.imageList.splice(rmIndex, 1)
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
        const rmIndex = state.uploadedImageList.findIndex(v => v.sha === item.sha)
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
