import { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'
import { DeployServerEnum } from '@/components/deploy-bar/deploy-bar.model'

export enum ElementPlusSizeEnum {
  // eslint-disable-next-line no-unused-vars
  large = 'large',
  // eslint-disable-next-line no-unused-vars
  default = 'default',
  // eslint-disable-next-line no-unused-vars
  small = 'small'
}

export enum WatermarkPositionEnum {
  // eslint-disable-next-line no-unused-vars
  leftTop = 'leftTop',
  // eslint-disable-next-line no-unused-vars
  leftBottom = 'leftBottom',
  // eslint-disable-next-line no-unused-vars
  rightTop = 'rightTop',
  // eslint-disable-next-line no-unused-vars
  rightBottom = 'rightBottom'
}

export enum ThemeModeEnum {
  // eslint-disable-next-line no-unused-vars
  system = 'system',
  // eslint-disable-next-line no-unused-vars
  light = 'light',
  // eslint-disable-next-line no-unused-vars
  dark = 'dark'
}

export enum LanguageEnum {
  // eslint-disable-next-line no-unused-vars
  zhCN = 'zh-CN',
  // eslint-disable-next-line no-unused-vars
  zhTW = 'zh-TW',
  // eslint-disable-next-line no-unused-vars
  en = 'en'
}

export interface DeployStatusInfo {
  uuid: string
  status: boolean | null
  latestTime: number | null
  type: DeployServerEnum
}

export interface UserSettingsModel {
  imageName: {
    autoAddHash: boolean
    prefixNaming: {
      enable: boolean
      prefix: string
    }
    autoTimestampNaming: boolean
  }
  theme: {
    mode: ThemeModeEnum
  }
  compress: {
    enable: boolean
    encoder: CompressEncoderEnum
  }
  elementPlusSize: ElementPlusSizeEnum
  imageLinkType: {
    selected: string
    presetList: {
      [key: string]: ImageLinkRuleModel
    }
  }
  imageLinkFormat: {
    enable: boolean
    selected: string
    presetList: Array<ImageLinkFormatModel>
  }
  starred?: boolean
  watermark: {
    enable: boolean
    text: string
    fontSize: number
    position: WatermarkPositionEnum
    textColor: string
    opacity: number
  }
  deploy: {
    [key: string]: DeployStatusInfo
  }
  language: LanguageEnum
}
