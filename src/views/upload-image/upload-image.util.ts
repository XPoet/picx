import type { ImageHandleResult, UserSettingsModel } from '@/common/model'
import { computed } from 'vue'
import { starredRepo } from '@/common/api'
import { store } from '@/stores'
import { createNamedUploadImage } from '@/utils/upload-naming'

const userSettings = computed(() => store.getters.getUserSettings).value

export const starred = async (userSettings: UserSettingsModel) => {
  const { starred } = userSettings
  if (!starred) {
    const res = await starredRepo()
    if (res) {
      await store.dispatch('SET_USER_SETTINGS', {
        starred: true,
      })
    }
  }
}

export const generateUploadImageObject = (input: ImageHandleResult) => createNamedUploadImage(input, userSettings.imageName)
