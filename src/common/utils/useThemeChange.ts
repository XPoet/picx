import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from '@/store'
import { UserSettingsModel } from '@/common/model/user-settings.model'

const useThemeChange = () => {
  const store = useStore()
  const setBodyClassName = (theme: 'dark' | 'light') => {
    nextTick(() => {
      const body = document.getElementsByTagName('body')[0]
      if (theme === 'dark') {
        body.classList.remove('light-mode')
        body.classList.add('dark-mode')
      } else {
        body.classList.remove('dark-mode')
        body.classList.add('light-mode')
      }
    })
  }
  const themeTimeResult = (autoLightThemeTime: string[]): boolean => {
    const hour = new Date().getHours()
    const min = new Date().getMinutes()
    if (
      hour < Number(autoLightThemeTime[0].substr(0, 2)) ||
      hour > Number(autoLightThemeTime[1].substr(0, 2))
    ) {
      return false
    }
    if (
      hour === Number(autoLightThemeTime[0].substr(0, 2)) &&
      min > Number(autoLightThemeTime[0].substr(-2))
    ) {
      return false
    }
    return !(
      hour === Number(autoLightThemeTime[1].substr(0, 2)) &&
      min > Number(autoLightThemeTime[1].substr(-2))
    )
  }
  const setThemeByConfigFn = (settings: UserSettingsModel) => {
    const { themeMode, autoLightThemeTime } = settings
    if (themeMode !== 'auto') {
      setBodyClassName(themeMode)
    } else if (themeTimeResult(autoLightThemeTime)) {
      setBodyClassName('light')
    } else {
      setBodyClassName('dark')
    }
  }
  watch(
    (): UserSettingsModel => store.getters.getUserSettings,
    (newValue) => {
      setThemeByConfigFn(newValue)
    },
    { deep: true }
  )

  const media = window.matchMedia('(prefers-color-scheme:dark)')
  // 监听样式切换
  const callback = (e: any) => {
    const prefersDarkMode = e.matches
    if (prefersDarkMode) {
      // console.log('黑暗模式')
      setBodyClassName('dark')
    } else {
      // console.log('亮色模式')
      setBodyClassName('light')
    }
  }

  onMounted(() => {
    setThemeByConfigFn(store.getters.getUserSettings)
    media.addEventListener('change', callback)
  })

  onUnmounted(() => {
    media.removeEventListener('change', callback)
  })
}

export default useThemeChange
