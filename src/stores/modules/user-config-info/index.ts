import { Module } from 'vuex'
import { BranchModeEnum, UserConfigInfoModel, DirModeEnum } from '@/common/model'
import { deepAssignObject, cleanObject, formatDatetime } from '@/utils'
import UserConfigInfoStateTypes from '@/stores/modules/user-config-info/types'
import RootStateTypes from '@/stores/types'
import { LS_PICX_CONFIG, NEW_DIR_COUNT_MAX } from '@/common/constant'

const initUserConfigInfo = (): UserConfigInfoModel => {
  const initConfig: UserConfigInfoModel = {
    token: '',
    owner: '',
    email: '',
    name: '',
    avatarUrl: '',
    selectedRepo: '',
    repoList: [],
    branchMode: BranchModeEnum.repoBranch,
    branchList: [],
    selectedBranch: '',
    selectedDir: '',
    dirMode: DirModeEnum.repoDir,
    dirList: [],
    logined: false,
    selectedDirList: [],
    viewDir: ''
  }

  const LSConfig: string | null = localStorage.getItem(LS_PICX_CONFIG)

  if (LSConfig) {
    // Assign: oldConfig -> initConfig
    deepAssignObject(initConfig, JSON.parse(LSConfig))

    if (initConfig.selectedBranch && !initConfig.branchList.length) {
      initConfig.branchList = [
        {
          value: initConfig.selectedBranch,
          label: initConfig.selectedBranch
        }
      ]
    }

    if (initConfig.dirMode === DirModeEnum.autoDir) {
      initConfig.selectedDir = formatDatetime('yyyyMMdd')
    }

    return initConfig
  }

  return initConfig
}

const convertSpecialCharacter = (state: UserConfigInfoStateTypes): void => {
  const { selectedDir, selectedBranch, dirMode } = state.userConfigInfo
  if (dirMode === 'newDir') {
    const strList = selectedDir.split('')
    let count = 0
    let newStr = ''
    const specStrList = [' ', '.', '、', ',', '，', '!', '？', '?']
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < strList.length; i++) {
      if (specStrList.some((x) => x === strList[i])) {
        strList[i] = '-'
      }
      if (strList[i] === '/') {
        count += 1
      }
      if (count >= NEW_DIR_COUNT_MAX) {
        break
      }
      newStr += strList[i]
    }
    state.userConfigInfo.selectedDir = newStr
  }
  state.userConfigInfo.selectedBranch = selectedBranch.replace(/\s+/g, '-')
}

const userConfigInfoModule: Module<UserConfigInfoStateTypes, RootStateTypes> = {
  state: {
    userConfigInfo: initUserConfigInfo()
  },

  actions: {
    // 持久化状态获取
    USER_CONFIG_INFO_RESET({ state }) {
      state.userConfigInfo = initUserConfigInfo()
    },

    // 设置用户配置信息
    SET_USER_CONFIG_INFO({ state, dispatch }, configInfo: UserConfigInfoStateTypes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in configInfo) {
        // eslint-disable-next-line no-prototype-builtins
        if (state.userConfigInfo.hasOwnProperty(key)) {
          // @ts-ignore
          state.userConfigInfo[key] = configInfo[key]
        }
      }
      dispatch('USER_CONFIG_INFO_PERSIST')
    },

    // 用户配置信息 - 增加目录
    USER_CONFIG_INFO_ADD_DIR({ state, dispatch }, dir: string) {
      if (!state.userConfigInfo.dirList.some((v: any) => v.value === dir)) {
        state.userConfigInfo.dirList.push({ label: dir, value: dir })
        dispatch('USER_CONFIG_INFO_PERSIST')
      }
    },

    // 用户配置信息 - 删除目录列表的某个目录
    USER_CONFIG_INFO_REMOVE_DIR({ state, dispatch }, dir: string) {
      const { dirList } = state.userConfigInfo
      if (dirList.some((v: any) => v.value === dir)) {
        const rmIndex = dirList.findIndex((v: any) => v.value === dir)
        dirList.splice(rmIndex, 1)
        dispatch('USER_CONFIG_INFO_PERSIST')
      }
    },

    // 持久化用户配置信息
    USER_CONFIG_INFO_PERSIST({ state }) {
      convertSpecialCharacter(state)
      localStorage.setItem(LS_PICX_CONFIG, JSON.stringify(state.userConfigInfo))
    },

    // 退出登录
    USER_CONFIG_INFO_LOGOUT({ state }) {
      cleanObject(state.userConfigInfo)
    }
  },

  getters: {
    getUserLoginStatus: (state: UserConfigInfoStateTypes): boolean => state.userConfigInfo.logined,
    getUserConfigInfo: (state: UserConfigInfoStateTypes): UserConfigInfoModel =>
      state.userConfigInfo,
    getUserViewDir: (state: UserConfigInfoStateTypes): string => state.userConfigInfo.viewDir
  }
}

export default userConfigInfoModule
