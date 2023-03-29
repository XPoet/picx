import { UserSettingsModel } from '@/common/model'
import { starredRepo } from '@/common/api'
import { store } from '@/store'

export const starredPicX = async (userSettings: UserSettingsModel) => {
  const { starred } = userSettings
  if (!starred) {
    const res = await starredRepo()
    if (res) {
      await store.dispatch('SET_USER_SETTINGS', {
        starred: true
      })
    }
  }
}
