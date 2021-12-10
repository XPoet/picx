import { CompressEncoderMap } from '../utils/compress'

export interface UserSettingsModel {
  defaultHash: boolean
  defaultMarkdown: boolean
  themeMode: 'auto' | 'light' | 'dark'
  autoLightThemeTime: string[]
  isCompress: boolean
  compressEncoder: CompressEncoderMap
  elementPlusSize?: 'medium' | 'small' | 'mini'
}
