import { nextTick, watch } from 'vue'
import { useStore } from '@/store'
import { ThemeModeEnum, UserSettingsModel } from '@/common/model'

const setThemeMode = () => {
  const store = useStore()

  const setBodyClassName = async (theme: ThemeModeEnum) => {
    await nextTick(() => {
      const body = document.getElementsByTagName('html')[0]
      if (theme === ThemeModeEnum.dark) {
        body.classList.remove('light')
        body.classList.add('dark')
      }
      if (theme === ThemeModeEnum.light) {
        body.classList.remove('dark')
        body.classList.add('light')
      }
    })
  }

  const autoThemeModeTimeHandle = (autoLightTime: string[]) => {
    const getTimestamp = (i: number) => {
      const D = new Date()
      const yyyy = D.getFullYear()
      const mm = D.getMonth() + 1
      const dd = D.getDate()
      return new Date(`${yyyy}/${mm}/${dd} ${autoLightTime[i]}:00`).getTime()
    }
    const now = Date.now()
    return getTimestamp(0) <= now && now <= getTimestamp(1)
  }

  const setThemeByConfigFn = async (settings: UserSettingsModel) => {
    const { theme } = settings
    if (theme.mode === ThemeModeEnum.auto) {
      await setBodyClassName(
        autoThemeModeTimeHandle(theme.autoLightTime) ? ThemeModeEnum.light : ThemeModeEnum.dark
      )
    } else {
      await setBodyClassName(theme.mode)
    }
  }

  watch(
    (): UserSettingsModel => store.getters.getUserSettings,
    async (newValue) => {
      await setThemeByConfigFn(newValue)
    },
    { deep: true, immediate: true }
  )
}

export default setThemeMode
