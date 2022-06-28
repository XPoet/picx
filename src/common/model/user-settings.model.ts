import { CompressEncoderMap } from '../utils/compress'

export interface UserSettingsModel {
  defaultHash: boolean
  defaultMarkdown: boolean
  defaultPrefix: boolean
  prefixName: string
  themeMode: 'auto' | 'light' | 'dark'
  autoLightThemeTime: string[]
  isCompress: boolean
  compressEncoder: CompressEncoderMap
  elementPlusSize?: 'large' | 'default' | 'small'
}
