import { ElementPlusSizeEnum, LanguageEnum, ThemeModeEnum, UserSettingsModel } from '@/common/model'

export enum ImgLinkRuleActionsEnum {
  // eslint-disable-next-line no-unused-vars
  add,
  // eslint-disable-next-line no-unused-vars
  edit
}

export interface GlobalSettingsModel {
  folded: boolean
  elementPlusSize: ElementPlusSizeEnum
  language: LanguageEnum
  languageToggleTip: boolean
  theme: ThemeModeEnum
  showAnnouncement: boolean
  useCloudSettings: boolean
}

export default interface UserSettingsStateTypes {
  userSettings: UserSettingsModel
  cloudSettings?: UserSettingsModel | null
  globalSettings: GlobalSettingsModel
}
