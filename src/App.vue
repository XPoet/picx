<template>
  <el-config-provider :size="elementPlusSize" :z-index="3000" :locale="elementPlusLocale">
    <main-container />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, getCurrentInstance, watch, computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCN from 'element-plus/lib/locale/lang/zh-cn'
import zhTW from 'element-plus/lib/locale/lang/zh-tw'
import en from 'element-plus/lib/locale/lang/en'
import setThemeMode from '@/utils/set-theme-mode'
import { useStore } from '@/store'
import { getRegionByIP, throttle } from '@/utils'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import MainContainer from '@/views/main-container/main-container.vue'

const instance = getCurrentInstance()
const store = useStore()

const userSettings = computed(() => store.getters.getUserSettings).value

const elementPlusSize = ref<ElementPlusSizeEnum>(ElementPlusSizeEnum.default)
const elementPlusLocale = ref(zhCN) // zhCN | zhTW | en

const elementPlusSizeHandle = (width: number) => {
  if (width <= 600) {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.small
    })
    elementPlusSize.value = ElementPlusSizeEnum.small
  } else if (width <= 900) {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.default
    })
    elementPlusSize.value = ElementPlusSizeEnum.default
  } else {
    store?.dispatch('SET_USER_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.large
    })
    elementPlusSize.value = ElementPlusSizeEnum.large
  }
}

const setLanguage = () => {
  getRegionByIP().then((region) => {
    if (region === 'CN') {
      store.dispatch('SET_USER_SETTINGS', {
        language: 'zh-CN'
      })
    } else if (region === 'HK' || region === 'TW') {
      store.dispatch('SET_USER_SETTINGS', {
        language: 'zh-TW'
      })
    } else {
      store.dispatch('SET_USER_SETTINGS', {
        language: 'en'
      })
    }
  })
}

const init = () => {
  elementPlusSizeHandle(window.innerWidth)
  window.addEventListener(
    'resize',
    throttle((e: any) => {
      elementPlusSizeHandle(e.target.innerWidth)
    }, 600)
  )

  setThemeMode()
  setLanguage()
}

watch(
  () => userSettings.language,
  (language: LanguageEnum) => {
    if (language === LanguageEnum.zhCN) {
      elementPlusLocale.value = zhCN
      instance!.proxy!.$i18n.locale = 'zh-CN'
    } else if (language === LanguageEnum.zhTW) {
      elementPlusLocale.value = zhTW
      instance!.proxy!.$i18n.locale = 'zh-TW'
    } else if (language === LanguageEnum.en) {
      elementPlusLocale.value = en
      instance!.proxy!.$i18n.locale = 'en'
    } else {
      elementPlusLocale.value = zhCN
      instance!.proxy!.$i18n.locale = 'zh-CN'
    }
  },
  {
    deep: true
  }
)

onMounted(() => {
  init()
})
</script>

<style lang="stylus">
#app {
  position relative
  box-sizing border-box
  width 100%
  height 100%
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
}
</style>
