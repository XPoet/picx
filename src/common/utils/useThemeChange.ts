import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from '@/store'
import {
  PersonalSetting,
  AutoLightThemeDateType
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
  const themeTimeResult = (autoLightThemeDate: AutoLightThemeDateType): boolean => {
    const hour = new Date().getHours()
    const min = new Date().getMinutes()
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
    return !(
      hour === Number(autoLightThemeDate[1].substr(0, 2)) &&
      min > Number(autoLightThemeDate[1].substr(-2))
    )
  }
  const setThemeByConfigFn = (config: PersonalSetting) => {
    const { themeMode, autoLightThemeDate } = config
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
      // console.log('黑暗模式')
      setBodyClassName('dark')
    } else {
      // console.log('亮色模式')
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
