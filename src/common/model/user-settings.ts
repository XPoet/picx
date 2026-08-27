import type { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'

export enum ElementPlusSizeEnum {
  large = 'large',

  default = 'default',

  small = 'small',
}

export enum WatermarkPositionEnum {
  leftTop = 'leftTop',

  leftBottom = 'leftBottom',

  rightTop = 'rightTop',

  rightBottom = 'rightBottom',

  fullScreen = 'fullScreen',
}

export enum ThemeModeEnum {
  system = 'system',

  light = 'light',

  dark = 'dark',
}

export enum LanguageEnum {
  zhCN = 'zh-CN',

  zhTW = 'zh-TW',

  en = 'en',
}

export interface UserSettingsModel {
  imageName: {
    enableHash: boolean
    addPrefix: {
      enable: boolean
      prefix: string
    }
  }
  compress: {
    enable: boolean
    encoder: CompressEncoderEnum
  }
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
    /** 全屏水印旋转角度（度），仅在 position 为 fullScreen 时生效 */
    rotate: number
    /** 全屏水印平铺间距（px），仅在 position 为 fullScreen 时生效 */
    gap: number
  }
  showAnnouncement?: boolean
}
