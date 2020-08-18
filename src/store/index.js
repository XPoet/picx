import Vue from 'vue'
import Vuex from 'vuex'
import {picx_key} from "../utils/localStorage";
import {userConfigInfoModel} from "../views/Config/model";
import cleanObject from "../utils/cleanObject";

Vue.use(Vuex)

const initUserConfigInfo = () => {
  let config = localStorage.getItem(picx_key)
  return config ? JSON.parse(config) : userConfigInfoModel
}

export default new Vuex.Store({
  state: {
    userConfigInfo: initUserConfigInfo(),
    isLogout: false
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
    PERSIST_USER_CONFIG_INFO(state, configInfo) {
      this.commit('SET_USER_CONFIG_INFO', configInfo)
      localStorage.setItem(picx_key, JSON.stringify(state.userConfigInfo))
    },

    // 重置用户配置信息 clean state.userConfigInfo all value
    RESET_USER_CONFIG_INFO(state) {
      cleanObject(state.userConfigInfo)
    },

  },

  getters: {
    getUserConfigInfo: state => JSON.parse(JSON.stringify(state.userConfigInfo)),
    getUserAvatar: state => state.userConfigInfo.avatar_url,
    getUserNickname: state => state.userConfigInfo.nickname,
    getLogoutStatus: state => state.isLogout,
  },

  actions: {
    // 退出登录 action
    LOGOUT({commit, state}) {
      commit('RESET_USER_CONFIG_INFO')
      state.isLogout = true
      localStorage.removeItem(picx_key)
    }
  },
  modules: {}
})
