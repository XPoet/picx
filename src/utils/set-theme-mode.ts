import { watch, nextTick } from 'vue'
import { useStore } from '@/store'
import { UserSettingsModel } from '@/common/model/user-settings.model'

const setThemeMode = () => {
  const store = useStore()

  const setBodyClassName = async (theme: 'dark' | 'light') => {
    await nextTick(() => {
      const body = document.getElementsByTagName('html')[0]
      if (theme === 'dark') {
        body.classList.remove('light')
        body.classList.add('dark')
      } else {
        body.classList.remove('dark')
        body.classList.add('light')
      }
    })
  }

  const autoThemeModeTimeHandle = (autoLightThemeTime: string[]) => {
    const getTimestamp = (i: number) => {
      const D = new Date()
      const yyyy = D.getFullYear()
      const mm = D.getMonth() + 1
      const dd = D.getDate()
      return new Date(`${yyyy}/${mm}/${dd} ${autoLightThemeTime[i]}:00`).getTime()
    }
    const now = Date.now()
    return getTimestamp(0) <= now && now <= getTimestamp(1)
  }

  const setThemeByConfigFn = (settings: UserSettingsModel) => {
    const { themeMode, autoLightThemeTime } = settings
    if (themeMode === 'auto') {
      setBodyClassName(autoThemeModeTimeHandle(autoLightThemeTime) ? 'light' : 'dark')
    } else {
      setBodyClassName(themeMode)
    }
  }

  watch(
    (): UserSettingsModel => store.getters.getUserSettings,
    (newValue) => {
      setThemeByConfigFn(newValue)
    },
    { deep: true, immediate: true }
  )
}

export default setThemeMode
