import { CompressEncoderMap } from '@/utils/compress-image'
import { ImageLinkRuleModel } from '@/common/model'

export interface UserSettingsModel {
  defaultHash: boolean
  defaultMarkdown: boolean
  defaultPrefix: boolean
  prefixName: string
  themeMode: 'auto' | 'light' | 'dark'
  autoLightThemeTime: string[]
  isCompress: boolean
  compressEncoder: CompressEncoderMap
  elementPlusSize: 'large' | 'default' | 'small'
  imageLinkType: {
    selected: string
    presetList: Array<ImageLinkRuleModel>
  }
}
