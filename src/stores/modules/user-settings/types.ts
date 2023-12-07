import { UserSettingsModel } from '@/common/model'

export enum ImgLinkRuleActionsEnum {
  // eslint-disable-next-line no-unused-vars
  add,
  // eslint-disable-next-line no-unused-vars
  edit
}

export default interface UserSettingsStateTypes {
  userSettings: UserSettingsModel
}
