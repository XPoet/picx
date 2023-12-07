import { Module } from 'vuex'
import {
  CompressEncoderEnum,
  ElementPlusSizeEnum,
  ImageLinkRuleModel,
  ImageLinkTypeEnum,
  LanguageEnum,
  ThemeModeEnum,
  UserSettingsModel,
  WatermarkPositionEnum
} from '@/common/model'
import { deepAssignObject, getLocal, getUuid } from '@/utils'
import UserConfigInfoStateTypes from '@/stores/modules/user-config-info/types'
import RootStateTypes from '@/stores/types'
import UserSettingsStateTypes, {
  ImgLinkRuleActionsEnum
} from '@/stores/modules/user-settings/types'
import { LS_PICX_SETTINGS } from '@/common/constant'
import { DeployServerEnum } from '@/components/image-hosting-deploy/image-hosting-deploy.model'
import { imgLinkRuleVerification } from '@/stores/modules/user-settings/utils'

const initSettings: UserSettingsModel = {
  imageName: {
    autoAddHash: true,
    autoTimestampNaming: false,
    prefixNaming: { enable: false, prefix: '' }
  },
  compress: {
    enable: true,
    encoder: CompressEncoderEnum.webP
  },
  theme: {
    mode: ThemeModeEnum.system
  },
  elementPlusSize: ElementPlusSizeEnum.default,
  imageLinkType: {
    selected: ImageLinkTypeEnum.jsDelivr,
    presetList: {
      // GitHubPages
      [`${ImageLinkTypeEnum.GitHubPages}`]: {
        id: getUuid(),
        name: ImageLinkTypeEnum.GitHubPages,
        rule: 'https://{{owner}}.github.io/{{repo}}/{{path}}'
      },
      // GitHub
      [`${ImageLinkTypeEnum.GitHub}`]: {
        id: getUuid(),
        name: ImageLinkTypeEnum.GitHub,
        rule: 'https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}'
      },
      // jsDelivr
      [`${ImageLinkTypeEnum.jsDelivr}`]: {
        id: getUuid(),
        name: ImageLinkTypeEnum.jsDelivr,
        rule: 'https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      },
      // Statically
      [`${ImageLinkTypeEnum.Statically}`]: {
        id: getUuid(),
        name: ImageLinkTypeEnum.Statically,
        rule: 'https://cdn.statically.io/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      },
      // ChinaJsDelivr
      [`${ImageLinkTypeEnum.ChinaJsDelivr}`]: {
        id: getUuid(),
        name: ImageLinkTypeEnum.ChinaJsDelivr,
        rule: 'https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}'
      }
    }
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
      },
      {
        name: 'BBCode',
        format: '[img]imageLink[/img]'
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
  },
  deploy: {
    github: {
      uuid: getUuid(),
      status: null,
      latestTime: null,
      type: DeployServerEnum.githubPages
    }
  },
  language: LanguageEnum.zhCN
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
    SET_USER_SETTINGS({ state, dispatch }, configInfo: UserConfigInfoStateTypes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in configInfo) {
        // eslint-disable-next-line no-prototype-builtins
        if (state.userSettings.hasOwnProperty(key)) {
          // @ts-ignore
          state.userSettings[key] = configInfo[key]
        }
      }
      dispatch('USER_SETTINGS_PERSIST')
    },

    // 图片链接类型 - 增加规则
    ADD_IMAGE_LINK_TYPE_RULE({ state, dispatch }, { rule, $t }) {
      const ruleObjs = state.userSettings.imageLinkType.presetList
      if (!Object.hasOwn(ruleObjs, rule.name)) {
        imgLinkRuleVerification(rule, ImgLinkRuleActionsEnum.add, $t, (e: boolean) => {
          if (e) {
            state.userSettings.imageLinkType.presetList[rule.name] = rule
            dispatch('USER_SETTINGS_PERSIST')
          }
        })
      } else {
        ElMessage.error($t('settings.link_rule.error_msg_1'))
      }
    },

    // 图片链接类型 - 修改规则
    UPDATE_IMAGE_LINK_TYPE_RULE({ state, dispatch }, { rule, $t }) {
      imgLinkRuleVerification(rule, ImgLinkRuleActionsEnum.edit, $t, (e: boolean) => {
        if (e) {
          state.userSettings.imageLinkType.presetList[rule.name].rule = rule.rule
          dispatch('USER_SETTINGS_PERSIST')
        }
      })
    },

    // 图片链接类型 - 删除规则
    DEL_IMAGE_LINK_TYPE_RULE({ state, dispatch }, rule: ImageLinkRuleModel) {
      delete state.userSettings.imageLinkType.presetList[rule.name]
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
