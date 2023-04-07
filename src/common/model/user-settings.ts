import { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'

/**
 * 新建目录时最大的目录层级数
 */
export const NEW_DIR_COUNT_MAX: number = 5

/**
 * 允许上传图片的最大尺寸
 */
export const IMG_UPLOAD_MAX_SIZE: number = 30 // MB

export enum ElementPlusSizeEnum {
  // eslint-disable-next-line no-unused-vars
  large = 'large',
  // eslint-disable-next-line no-unused-vars
  default = 'default',
  // eslint-disable-next-line no-unused-vars
  small = 'small'
}

export interface UserSettingsModel {
  defaultHash: boolean
  enableImageLinkFormat: boolean
  defaultPrefix: boolean
  prefixName: string
  themeMode: 'auto' | 'light' | 'dark'
  autoLightThemeTime: string[]
  isCompress: boolean
  compressEncoder: CompressEncoderEnum
  elementPlusSize: ElementPlusSizeEnum
  imageLinkType: {
    selected: string
    presetList: Array<ImageLinkRuleModel>
  }
  imageLinkFormat: {
    selected: string
    presetList: Array<ImageLinkFormatModel>
  }

  starred?: boolean
  defaultWatermark: boolean
  watermarkSettings: {
    text: string
    fontSize: number
    position: string
    opacity: number
  }
}
