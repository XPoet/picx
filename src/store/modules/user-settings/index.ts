import { Module } from 'vuex'
import { PICX_SETTINGS, UserSettingsModel, ExternalLinkRuleModel } from '@/common/model'
import { deepAssignObject } from '@/utils/object-helper'
import UserConfigInfoStateTypes from '@/store/modules/user-config-info/types'
import RootStateTypes from '@/store/types'
import { CompressEncoderMap } from '@/utils/compress'
import UserSettingsStateTypes from '@/store/modules/user-settings/types'
import { getLocalItem, getUuid } from '@/utils/common-utils'

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
  externalLinkType: 'Staticaly',
  externalLinkTypeList: [
    {
      id: getUuid(),
      type: 'Staticaly',
      rule: 'https://cdn.staticaly.com/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
      editable: false
    },
    {
      id: getUuid(),
      type: 'ChinaJsDelivr',
      rule: 'https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
      editable: false
    },
    {
      id: getUuid(),
      type: 'jsDelivr',
      rule: 'https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}',
      editable: false
    },
    {
      id: getUuid(),
      type: 'GitHub',
      rule: 'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}',
      editable: false
    }
  ]
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

    // 增加规则
    ADD_CDN_TYPE_RULE({ state, dispatch }, rule: ExternalLinkRuleModel) {
      const list = state.userSettings.externalLinkTypeList
      if (!list.some((x) => x.type === rule.type)) {
        if (
          rule.rule.includes('{{owner}}') &&
          rule.rule.includes('{{repo}}') &&
          rule.rule.includes('{{branch}}') &&
          rule.rule.includes('{{path}}')
        ) {
          state.userSettings.externalLinkTypeList.push(rule)
          dispatch('USER_SETTINGS_PERSIST')
        } else {
          ElMessage.error('添加失败，该 CDN 加速规则不合法！')
        }
      } else {
        ElMessage.error('添加失败，该 CDN 加速规则已存在！')
      }
    },

    // 修改规则
    MODIFY_CDN_TYPE_RULE({ state, dispatch }, rule: ExternalLinkRuleModel) {
      if (
        rule.rule.includes('{{owner}}') &&
        rule.rule.includes('{{repo}}') &&
        rule.rule.includes('{{branch}}') &&
        rule.rule.includes('{{path}}')
      ) {
        const tgt = state.userSettings.externalLinkTypeList.find((x) => x.id === rule.id)
        if (tgt) {
          tgt.rule = rule.rule
          dispatch('USER_SETTINGS_PERSIST')
        }
      } else {
        ElMessage.error('修改失败，CDN 加速规则不合法！')
      }
    },

    // 删除规则
    DEL_CDN_TYPE_RULE({ state, dispatch }, id: string) {
      const list = state.userSettings.externalLinkTypeList
      list.splice(
        list.findIndex((x) => x.id === id),
        1
      )
      dispatch('USER_SETTINGS_PERSIST')
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
