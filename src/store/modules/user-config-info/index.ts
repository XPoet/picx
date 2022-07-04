import { Module } from 'vuex'
import {
  BranchModeEnum,
  UserConfigInfoModel
} from '@/common/model/user-config-info.model'
import { PICX_CONFIG } from '@/common/model/storage.model'
import { deepAssignObject, cleanObject } from '@/utils/object-helper'
import UserConfigInfoStateTypes from '@/store/modules/user-config-info/types'
import RootStateTypes from '@/store/types'
import { DirModeEnum } from '@/common/model/dir.model'
import TimeHelper from '@/utils/time-helper'

const initUserConfigInfo = (): UserConfigInfoModel => {
  const initConfig: UserConfigInfoModel = {
    token: '',
    owner: '',
    email: '',
    name: '',
    avatarUrl: '',
    selectedRepos: '',
    reposList: [],
    branchMode: BranchModeEnum.reposBranch,
    branchList: [],
    selectedBranch: '',
    selectedDir: '',
    dirMode: DirModeEnum.reposDir,
    dirList: [],
    loggingStatus: false,
    selectedDirList: []
  }

  const LSConfig: string | null = localStorage.getItem(PICX_CONFIG)

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
      initConfig.selectedDir = TimeHelper.getYyyyMmDd()
    }

    return initConfig
  }

  return initConfig
}

const userConfigInfoUpdate = (state: UserConfigInfoStateTypes): void => {
  const { selectedDir, selectedBranch, dirMode } = state.userConfigInfo
  if (dirMode === 'newDir') {
    const strList = selectedDir.split('')
    let count = 0
    let newStr = ''
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < strList.length; i++) {
      if (strList[i] === ' ' || strList[i] === '.' || strList[i] === '、') {
        strList[i] = '-'
      }
      if (strList[i] === '/') {
        count += 1
      }
      if (count >= 3) {
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
    SET_USER_CONFIG_INFO(
      { state, dispatch },
      configInfo: UserConfigInfoStateTypes,
      needPersist: boolean = true
    ) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in configInfo) {
        // eslint-disable-next-line no-prototype-builtins
        if (state.userConfigInfo.hasOwnProperty(key)) {
          // @ts-ignore
          state.userConfigInfo[key] = configInfo[key]
        } else if (key === 'needPersist') {
          // eslint-disable-next-line
          needPersist = false
        }
      }
      if (!needPersist) return
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
      userConfigInfoUpdate(state)
      localStorage.setItem(PICX_CONFIG, JSON.stringify(state.userConfigInfo))
    },

    // 修改 userConfigInfo 但无需持久化 (目前提供图床管理页面使用)
    USER_CONFIG_INFO_NOT_PERSIST({ state }) {
      userConfigInfoUpdate(state)
    },

    // 退出登录
    USER_CONFIG_INFO_LOGOUT({ state }) {
      cleanObject(state.userConfigInfo)
    }
  },

  getters: {
    getUserLoggingStatus: (state: UserConfigInfoStateTypes): boolean =>
      state.userConfigInfo.loggingStatus,
    getUserConfigInfo: (state: UserConfigInfoStateTypes): UserConfigInfoModel =>
      state.userConfigInfo
  }
}

export default userConfigInfoModule
