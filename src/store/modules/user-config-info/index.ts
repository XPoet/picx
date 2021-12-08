import { Module } from 'vuex'
import { BranchModeEnum, UserConfigInfoModel } from '@/common/model/userConfigInfo.model'
import { PICX_CONFIG } from '@/common/model/localStorage.model'
import cleanObject from '@/common/utils/clean-object'
import UserConfigInfoStateTypes from '@/store/modules/user-config-info/types'
import RootStateTypes from '@/store/types'
import { DirModeEnum } from '@/common/model/dir.model'
import TimeHelper from '@/common/utils/time-helper'
import { CompressMethod } from '@/common/utils/compress'

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
    selectedBranch: '',
    branchList: [],
    dirMode: DirModeEnum.reposDir,
    selectedDir: '',
    dirList: [],
    loggingStatus: false,
    personalSetting: {
      defaultHash: true,
      defaultMarkdown: false,
      defaultCompress: true,
      defaultCompressMethod: CompressMethod.mozJPEG
    }
  }

  const LSConfig: string | null = localStorage.getItem(PICX_CONFIG)
  if (LSConfig) {
    const oldConfig: UserConfigInfoModel = JSON.parse(LSConfig)

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const oldConfigKey in oldConfig) {
      // @ts-ignore
      initConfig[oldConfigKey] = oldConfig[oldConfigKey]
    }

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

const userConfigInfoModule: Module<UserConfigInfoStateTypes, RootStateTypes> = {
  state: {
    userConfigInfo: initUserConfigInfo()
  },

  actions: {
    // 设置用户配置信息
    SET_USER_CONFIG_INFO({ state }, configInfo: UserConfigInfoStateTypes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in configInfo) {
        // eslint-disable-next-line no-prototype-builtins
        if (state.userConfigInfo.hasOwnProperty(key)) {
          // @ts-ignore
          state.userConfigInfo[key] = configInfo[key]
        }
      }
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
      state.userConfigInfo.selectedDir = state.userConfigInfo.selectedDir.replace(
        /\s+/g,
        '-'
      )

      state.userConfigInfo.selectedBranch = state.userConfigInfo.selectedBranch.replace(
        /\s+/g,
        '-'
      )

      localStorage.setItem(PICX_CONFIG, JSON.stringify(state.userConfigInfo))
    },

    // 退出登录
    USER_CONFIG_INFO_LOGOUT({ state }) {
      cleanObject(state.userConfigInfo)
      localStorage.removeItem(PICX_CONFIG)
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
