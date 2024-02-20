import { nextTick, watch } from 'vue'
import { useStore } from '@/stores'
import { ThemeModeEnum } from '@/common/model'
import { isDarkModeOfSystem } from '@/utils/system'

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
    if (mode === ThemeModeEnum.system) {
      await setHtmlClassName(isDarkModeOfSystem() ? ThemeModeEnum.dark : ThemeModeEnum.light)
    } else {
      await setHtmlClassName(mode)
    }
  }

  watch(
    () => store.getters.getGlobalSettings.theme,
    async (newValue) => {
      await setThemeByConfig(newValue)
    },
    { deep: true, immediate: true }
  )
}

export default setThemeMode
