import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from '@/store'
import {
  PersonalSetting,
  AutoLightThemeDateTyoe
} from '@/common/model/userConfigInfo.model'

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
  const themeTimeResult = (autoLightThemeDate: AutoLightThemeDateTyoe): boolean => {
    const hour = new Date().getHours() * 1
    const min = new Date().getMinutes() * 1
    if (
      hour < Number(autoLightThemeDate[0].substr(0, 2)) ||
      hour > Number(autoLightThemeDate[1].substr(0, 2))
    ) {
      return false
    }
    if (
      hour === Number(autoLightThemeDate[0].substr(0, 2)) &&
      min > Number(autoLightThemeDate[0].substr(-2))
    ) {
      return false
    }
    if (
      hour === Number(autoLightThemeDate[1].substr(0, 2)) &&
      min > Number(autoLightThemeDate[1].substr(-2))
    ) {
      return false
    }

    return true
  }
  const setThemeByConfigFn = (confit: PersonalSetting) => {
    const { themeMode, autoLightThemeDate } = confit
    if (themeMode !== 'auto') {
      setBodyClassName(themeMode)
    } else if (themeTimeResult(autoLightThemeDate)) {
      setBodyClassName('light')
    } else {
      setBodyClassName('dark')
    }
  }
  watch(
    (): PersonalSetting => store.getters.getUserConfigInfo.personalSetting,
    (newValue) => {
      setThemeByConfigFn(newValue)
    }
  )

  const media = window.matchMedia('(prefers-color-scheme:dark)')
  // 监听样式切换
  const callback = (e: any) => {
    const prefersDarkMode = e.matches
    if (prefersDarkMode) {
      console.log('黑暗模式')
      setBodyClassName('dark')
    } else {
      console.log('亮色模式')
      setBodyClassName('light')
    }
  }

  onMounted(() => {
    setThemeByConfigFn(store.getters.getUserConfigInfo.personalSetting)
    media.addEventListener('change', callback)
  })
  onUnmounted(() => {
    media.removeEventListener('change', callback)
  })
}

export default useThemeChange
