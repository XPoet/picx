import { Module } from 'vuex'
import {
  CompressEncoderEnum,
  ElementPlusSizeEnum,
  ImageLinkRuleModel,
  ThemeModeEnum,
  UserSettingsModel,
  WatermarkPositionEnum
} from '@/common/model'
import { deepAssignObject, getLocal, getUuid } from '@/utils'
import UserConfigInfoStateTypes from '@/store/modules/user-config-info/types'
import RootStateTypes from '@/store/types'
import UserSettingsStateTypes from '@/store/modules/user-settings/types'
import { LS_PICX_SETTINGS } from '@/common/constant'

const initSettings: UserSettingsModel = {
  defaultHash: true,
  prefixNaming: {
    enable: false,
    prefix: ''
  },
  compress: {
    enable: true,
    encoder: CompressEncoderEnum.webP
  },
  theme: {
    mode: ThemeModeEnum.light,
    autoLightTime: ['08:00', '19:00']
  },
  elementPlusSize: ElementPlusSizeEnum.default,
  imageLinkType: {
    selected: 'Staticaly',
    presetList: [
      {
        id: getUuid(),
        name: 'Staticaly',
        rule: 'https://cdn.staticaly.com/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      },
      {
        id: getUuid(),
        name: 'ChinaJsDelivr',
        rule: 'https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      },
      {
        id: getUuid(),
        name: 'jsDelivr',
        rule: 'https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      },
      {
        id: getUuid(),
        name: 'GitHub',
        rule: 'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}'
      }
    ]
  },
  imageLinkFormat: {
    enable: false,
    selected: 'Markdown',
    presetList: [
      {
        name: 'Markdown',
        format: '![imageName](imageLink)'
      },
      {
        name: 'HTML',
        format: '<img src="imageLink" alt="imageName" />'
      }
    ]
  },
  starred: false,
  watermark: {
    enable: false,
    text: 'PicX',
    fontSize: 50,
    position: WatermarkPositionEnum.rightBottom,
    textColor: '#FFFFFF',
    opacity: 0.5
  }
}

const initUserSettings = (): UserSettingsModel => {
  const LSSettings = getLocal(LS_PICX_SETTINGS)
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

    // 图片链接类型 - 增加规则
    ADD_IMAGE_LINK_TYPE_RULE({ state, dispatch }, rule: ImageLinkRuleModel) {
      const list = state.userSettings.imageLinkType.presetList
      if (!list.some((x) => x.name === rule.name)) {
        if (
          rule.rule.includes('{{owner}}') &&
          rule.rule.includes('{{repo}}') &&
          rule.rule.includes('{{branch}}') &&
          rule.rule.includes('{{path}}')
        ) {
          state.userSettings.imageLinkType.presetList.push(rule)
          dispatch('USER_SETTINGS_PERSIST')
        } else {
          ElMessage.error('添加失败，该图片链接规则不合法')
        }
      } else {
        ElMessage.error('添加失败，该图片链接规则规则已存在')
      }
    },

    // 图片链接类型 - 修改规则
    UPDATE_IMAGE_LINK_TYPE_RULE({ state, dispatch }, rule: ImageLinkRuleModel) {
      if (
        rule.rule.includes('{{owner}}') &&
        rule.rule.includes('{{repo}}') &&
        rule.rule.includes('{{branch}}') &&
        rule.rule.includes('{{path}}')
      ) {
        const tgt = state.userSettings.imageLinkType.presetList.find((x) => x.id === rule.id)
        if (tgt) {
          tgt.rule = rule.rule
          dispatch('USER_SETTINGS_PERSIST')
        }
      } else {
        ElMessage.error('修改失败，该图片链接规则不合法')
      }
    },

    // 图片链接类型 - 删除规则
    DEL_IMAGE_LINK_TYPE_RULE({ state, dispatch }, id: string) {
      const list = state.userSettings.imageLinkType.presetList
      list.splice(
        list.findIndex((x) => x.id === id),
        1
      )
      dispatch('USER_SETTINGS_PERSIST')
    },

    // 持久化
    USER_SETTINGS_PERSIST({ state }) {
      localStorage.setItem(LS_PICX_SETTINGS, JSON.stringify(state.userSettings))
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
