import { Module } from 'vuex'
import { PICX_SETTINGS } from '@/common/model/storage.model'
import { deepAssignObject } from '@/utils/object-helper'
import UserConfigInfoStateTypes from '@/store/modules/user-config-info/types'
import RootStateTypes from '@/store/types'
import { CompressEncoderMap } from '@/utils/compress'
import { UserSettingsModel } from '@/common/model/user-settings.model'
import UserSettingsStateTypes from '@/store/modules/user-settings/types'
import { getLocalItem } from '@/utils/common-utils'
import ExternalLinkType from '@/common/model/external-link.model'

const initSettings: UserSettingsModel = {
  defaultHash: true,
  defaultMarkdown: false,
  defaultPrefix: false,
  prefixName: '',
  isCompress: true,
  compressEncoder: CompressEncoderMap.webP,
  themeMode: 'light',
  autoLightThemeTime: ['08:00', '19:00'],
  elementPlusSize: 'default',
  externalLinkType: ExternalLinkType.staticaly
}

const initUserSettings = (): UserSettingsModel => {
  const LSSettings = getLocalItem(PICX_SETTINGS)
  if (LSSettings) {
    deepAssignObject(initSettings, LSSettings)
  }
  return initSettings
}

const userSettingsModule: Module<UserSettingsStateTypes, RootStateTypes> = {
  state: {
    userSettings: initUserSettings()
  },

  actions: {
    // 设置
    SET_USER_SETTINGS({ state }, configInfo: UserConfigInfoStateTypes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in configInfo) {
        // eslint-disable-next-line no-prototype-builtins
        if (state.userSettings.hasOwnProperty(key)) {
          // @ts-ignore
          state.userSettings[key] = configInfo[key]
        }
      }
    },

    // 持久化
    USER_SETTINGS_PERSIST({ state }) {
      localStorage.setItem(PICX_SETTINGS, JSON.stringify(state.userSettings))
    },

    // 退出登录
    USER_SETTINGS_LOGOUT({ state }) {
      state.userSettings = initSettings
    }
  },

  getters: {
    getUserSettings: (state): UserSettingsModel => state.userSettings
  }
}

export default userSettingsModule
