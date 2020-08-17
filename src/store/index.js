import Vue from 'vue'
import Vuex from 'vuex'
import {picx_key} from "../utils/localStorage";

Vue.use(Vuex)

const initUserConfigInfo = () => {
  let config = localStorage.getItem(picx_key)

  if (config) {
    return JSON.parse(config)
  }

  return {
    token: '',
    username: '',
    email: '',
    nickname: '',
    avatar_url: '',
    selectedRepos: '',
    reposList: [],
    dirMode: '',
    selectedDir: '',
    dirList: []
  }

}

export default new Vuex.Store({
  state: {
    userConfigInfo: initUserConfigInfo(),
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
      localStorage.setItem(picx_key, JSON.stringify(state.userConfigInfo))
    },

    // 删除用户配置信息
    REMOVE_USER_CONFIG_INFO(state) {
      for (let key in state.userConfigInfo) {
        const type = Object.prototype.toString.call(state.userConfigInfo[key]).split(' ')[1]
        const targetType = type.substring(0, type.length - 1)
        if (targetType === 'String') {
          state.userConfigInfo[key] = ''
        }
        if (targetType === 'Array') {
          state.userConfigInfo[key] = []
        }
      }
    }


  },
  getters: {
    getUserAvatar: state => state.userConfigInfo.avatar_url,
    getUserNickname: state => state.userConfigInfo.nickname
  },
  actions: {},
  modules: {}
})
