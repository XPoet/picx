import { onScopeDispose, watch } from 'vue'
import { ThemeModeEnum } from '@/common/model'
import { useStore } from '@/stores'

/** 在 AppWrap 的 setup 中初始化一次，系统监听随作用域释放。 */
const setThemeMode = () => {
  const store = useStore()
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const mode = store.getters.getGlobalSettings.theme
    const dark = mode === ThemeModeEnum.dark || (mode === ThemeModeEnum.system && media.matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
  }

  const stop = watch(() => store.getters.getGlobalSettings.theme, apply, { immediate: true })
  media.addEventListener('change', apply)
  onScopeDispose(() => {
    stop()
    media.removeEventListener('change', apply)
  })
}

export default setThemeMode
