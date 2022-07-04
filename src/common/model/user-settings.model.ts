import { CompressEncoderMap } from '../../utils/compress'
import ExternalLinkType from '@/common/model/external-link.model'

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
  externalLinkType: ExternalLinkType
}
