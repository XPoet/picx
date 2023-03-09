import { CompressEncoderEnum, ImageLinkRuleModel } from '@/common/model'

export interface UserSettingsModel {
  defaultHash: boolean
  defaultMarkdown: boolean
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
}
