import { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'

/**
 * 新建目录时最大的目录层级数
 */
export const NEW_DIR_COUNT_MAX: number = 5

export enum ElementPlusSizeEnum {
  large = 'large',
  default = 'default',
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
}
