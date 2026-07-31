import type {
  ElementPlusSizeEnum,
  LanguageEnum,
  ThemeModeEnum,
  UserSettingsModel,
} from '@/common/model'

export enum ImgLinkRuleActionsEnum {
  add,

  edit,
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
