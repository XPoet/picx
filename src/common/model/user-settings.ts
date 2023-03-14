import { CompressEncoderEnum, ImageLinkFormatModel, ImageLinkRuleModel } from '@/common/model'

export interface UserSettingsModel {
  defaultHash: boolean
  enableImageLinkFormat: boolean
  defaultPrefix: boolean
  prefixName: string
  themeMode: 'auto' | 'light' | 'dark'
  autoLightThemeTime: string[]
  isCompress: boolean
  compressEncoder: CompressEncoderEnum
  elementPlusSize: 'large' | 'default' | 'small'
  imageLinkType: {
    selected: string
    presetList: Array<ImageLinkRuleModel>
  }
  imageLinkFormat: {
    selected: string
    presetList: Array<ImageLinkFormatModel>
  }
}
