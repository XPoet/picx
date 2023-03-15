import { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'

/**
 * 最大的新建目录数
 */
export const newDirMaxCount: number = 5

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
