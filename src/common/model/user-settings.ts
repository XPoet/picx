import type {
  CompressEncoderEnum,
  ImageLinkFormatModel,
  ImageLinkRuleModel,
  ImageSortEnum,
} from '@/common/model'

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
    /** 时间戳命名，开启时与其他命名选项互斥 */
    enableTimestamp: boolean
    addPrefix: {
      enable: boolean
      prefix: string
    }
  }
  compress: {
    enable: boolean
    encoder: CompressEncoderEnum
  }
  management: {
    /** 图床管理页排序模式 */
    sort: ImageSortEnum
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
  deploy: {
    /** GitHub Pages 自定义域名（CNAME），空字符串表示未配置 */
    customDomain: string
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
