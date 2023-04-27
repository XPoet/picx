import { nextTick, watch } from 'vue'
import { useStore } from '@/store'
import { ThemeModeEnum } from '@/common/model'

const setThemeMode = () => {
  const store = useStore()

  const setHtmlClassName = async (theme: ThemeModeEnum) => {
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

  const setThemeByConfig = async (mode: ThemeModeEnum) => {
    if (mode === ThemeModeEnum.follow) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        await setHtmlClassName(ThemeModeEnum.dark)
      } else {
        await setHtmlClassName(ThemeModeEnum.light)
      }
    } else {
      await setHtmlClassName(mode)
    }
  }

  watch(
    () => store.getters.getUserSettings.theme.mode,
    async (newValue) => {
      await setThemeByConfig(newValue)
    },
    { deep: true, immediate: true }
  )
}

export default setThemeMode
