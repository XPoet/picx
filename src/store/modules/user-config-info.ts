import { PICX_CONFIG, UserConfigInfoModel } from '../../common/model/model'
import { Store } from 'vuex'
import cleanObject from '../../common/utils/cleanObject'

const initUserConfigInfo = (): UserConfigInfoModel => {
  let config: any = localStorage.getItem(PICX_CONFIG)
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

export default {

  state: () => (initUserConfigInfo()),

  actions: {
    // 设置用户配置信息
    SET_USER_CONFIG_INFO(store: Store<any>, configInfo: any) {
      for (const key in configInfo) {
        if (store.state.hasOwnProperty(key)) {
          store.state[key] = configInfo[key]
        }
      }
    },

    // 用户配置信息 - 增加目录
    USER_CONFIG_INFO_ADD_DIR(store: Store<any>, dir: string) {
      if (!store.state.dirList.some((v: any) => v.value === dir)) {
        store.state.dirList.push({label: dir, value: dir})
        store.dispatch('USER_CONFIG_INFO_PERSIST')
      }
    },

    // 用户配置信息 - 删除目录列表的某个目录
    USER_CONFIG_INFO_REMOVE_DIR(store: Store<any>, dir: string) {
      const dirList = store.state.dirList
      if (dirList.some((v: any) => v.value === dir)) {
        const rmIndex = dirList.findIndex((v: any) => v.value === dir)
        dirList.splice(rmIndex, 1)
        store.dispatch('USER_CONFIG_INFO_PERSIST')
      }
    },

    // 持久化用户配置信息
    USER_CONFIG_INFO_PERSIST(store: Store<any>) {
      store.state.selectedDir = store.state.selectedDir.replace(/\s+/g, '-')
      localStorage.setItem(PICX_CONFIG, JSON.stringify(store.state))
    },

    // 退出登录
    USER_CONFIG_INFO_LOGOUT(store: Store<any>) {
      cleanObject(store.state)
      localStorage.removeItem(PICX_CONFIG)
    },
  },


  getters: {
    getUserLoggingStatus: (state: any): boolean => state.loggingStatus,
    getUserConfigInfo: (state: any): UserConfigInfoModel => state,
  }
}
