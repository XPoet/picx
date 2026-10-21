<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import zhTW from 'element-plus/es/locale/lang/zh-tw'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import CopyFallbackDialog from '@/components/copy-fallback-dialog/copy-fallback-dialog.vue'
import { deployGhPages, deploymentShortcutEnabled, useDeploymentLifecycle } from '@/components/deploy-status-bar/deploy-status-bar.util'
import { useCloudSettingsSync } from '@/composables/use-cloud-settings-sync'
import { useDeploymentShortcut } from '@/composables/use-deployment-shortcut'
import router from '@/router'
import { useStore } from '@/stores'
import { setWindowTitle } from '@/utils'
import setThemeMode from '@/utils/set-theme-mode'
import MainContainer from '@/views/main-container/main-container.vue'
import { initGithubAuthorize } from '@/views/picx-login/picx-login.util'

const { locale } = useI18n()
const store = useStore()
useCloudSettingsSync()
useDeploymentLifecycle()
useDeploymentShortcut(() => ['/upload', '/settings'].includes(router.currentRoute.value.path) && deploymentShortcutEnabled(), () => {
  void deployGhPages()
})
setThemeMode()
const globalSettings = computed(() => store.getters.getGlobalSettings)
const elementPlusLocale = computed(() => ({
  [LanguageEnum.zhCN]: zhCN,
  [LanguageEnum.zhTW]: zhTW,
  [LanguageEnum.en]: en,
})[globalSettings.value.language] ?? en)

const onResize = () => {
  const size = window.innerWidth <= 700 ? ElementPlusSizeEnum.small : window.innerWidth <= 1000 ? ElementPlusSizeEnum.default : ElementPlusSizeEnum.large
  if (globalSettings.value.elementPlusSize !== size) {
    store.dispatch('SET_GLOBAL_SETTINGS', { elementPlusSize: size })
  }
}

const setLanguage = (language: LanguageEnum) => {
  const resolvedLanguage = Object.values(LanguageEnum).includes(language) ? language : LanguageEnum.en
  locale.value = resolvedLanguage
  document.documentElement.lang = resolvedLanguage
  const updateLocale = {
    [LanguageEnum.zhCN]: 'zh_CN',
    [LanguageEnum.zhTW]: 'zh_TW',
    [LanguageEnum.en]: 'en_US',
  } as const
  window.pluginWebUpdateNotice_?.setLocale(updateLocale[resolvedLanguage])
  const title = router.currentRoute.value.meta.title
  if (typeof title === 'string') {
    setWindowTitle(title)
  }
}

watch(() => globalSettings.value.language, setLanguage, { immediate: true })
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  setLanguage(globalSettings.value.language)
  initGithubAuthorize()
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <ElConfigProvider :size="globalSettings.elementPlusSize" :z-index="3000" :locale="elementPlusLocale">
    <MainContainer />
    <CopyFallbackDialog />
  </ElConfigProvider>
</template>
