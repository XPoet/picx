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
import { useStore } from '@/stores'
import { setWindowTitle, throttle } from '@/utils'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import MainContainer from '@/views/main-container/main-container.vue'
import router from '@/router'
import { initGithubAuthorize } from '@/views/picx-login/picx-login.util'

const instance = getCurrentInstance()
const store = useStore()
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const elementPlusSize = ref<ElementPlusSizeEnum>(ElementPlusSizeEnum.default)
const elementPlusLocale = ref(en) // zhCN | zhTW | en

const elementPlusSizeHandle = (width: number) => {
  if (width <= 700) {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.small,
      folded: true
    })
    elementPlusSize.value = ElementPlusSizeEnum.small
  } else if (width <= 1000) {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.default,
      folded: false
    })
    elementPlusSize.value = ElementPlusSizeEnum.default
  } else {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.large,
      folded: false
    })
    elementPlusSize.value = ElementPlusSizeEnum.large
  }
}

const setLanguage = (language: LanguageEnum) => {
  if (language === LanguageEnum.zhCN) {
    instance!.proxy!.$i18n.locale = 'zh-CN' // 设置 i18n 语言
    elementPlusLocale.value = zhCN // 设置 Element Plus 组件库语言
    // eslint-disable-next-line no-underscore-dangle
    window.pluginWebUpdateNotice_?.setLocale('zh_CN')
  } else if (language === LanguageEnum.zhTW) {
    instance!.proxy!.$i18n.locale = 'zh-TW'
    elementPlusLocale.value = zhTW
    // eslint-disable-next-line no-underscore-dangle
    window.pluginWebUpdateNotice_?.setLocale('zh_TW')
  } else {
    instance!.proxy!.$i18n.locale = 'en'
    elementPlusLocale.value = en
    // eslint-disable-next-line no-underscore-dangle
    window.pluginWebUpdateNotice_?.setLocale('en_US')
  }
  setWindowTitle(router.currentRoute.value.meta.title as string)
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
  setLanguage(globalSettings.language)
  initGithubAuthorize()
}

watch(
  () => globalSettings.language,
  (language: LanguageEnum) => {
    setLanguage(language)
  }
)

onMounted(() => {
  init()
})
</script>
