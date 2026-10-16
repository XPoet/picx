<script setup lang="ts">
import { ElConfigProvider, ElMessage } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import zhTW from 'element-plus/es/locale/lang/zh-tw'
import { computed, h, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import CopyFallbackDialog from '@/components/copy-fallback-dialog/copy-fallback-dialog.vue'
import { useCloudSettingsSync } from '@/composables/use-cloud-settings-sync'
import router from '@/router'
import { useStore } from '@/stores'
import { getLanguageByRegion, getRegionByIP, setWindowTitle } from '@/utils'
import setThemeMode from '@/utils/set-theme-mode'
import MainContainer from '@/views/main-container/main-container.vue'
import { initGithubAuthorize } from '@/views/picx-login/picx-login.util'

const { locale, t } = useI18n()
const store = useStore()
useCloudSettingsSync()
setThemeMode()
const globalSettings = computed(() => store.getters.getGlobalSettings)
const elementPlusLocale = computed(() => ({
  [LanguageEnum.zhCN]: zhCN,
  [LanguageEnum.zhTW]: zhTW,
  [LanguageEnum.en]: en,
})[globalSettings.value.language])

const onResize = () => {
  const size = window.innerWidth <= 700 ? ElementPlusSizeEnum.small : window.innerWidth <= 1000 ? ElementPlusSizeEnum.default : ElementPlusSizeEnum.large
  if (globalSettings.value.elementPlusSize !== size) {
    store.dispatch('SET_GLOBAL_SETTINGS', { elementPlusSize: size })
  }
}

const setLanguage = (language: LanguageEnum) => {
  locale.value = language
  document.documentElement.lang = language
  const updateLocale = {
    [LanguageEnum.zhCN]: 'zh_CN',
    [LanguageEnum.zhTW]: 'zh_TW',
    [LanguageEnum.en]: 'en_US',
  } as const
  window.pluginWebUpdateNotice_?.setLocale(updateLocale[language])
  const title = router.currentRoute.value.meta.title
  if (typeof title === 'string') {
    setWindowTitle(title)
  }
}

const setLanguageByIP = async () => {
  if (!globalSettings.value.languageToggleTip) {
    return
  }
  const region = await getRegionByIP()
  const language = getLanguageByRegion(region)
  if (language === globalSettings.value.language) {
    return
  }
  const msgTxt = t('toggle_language_msg', {
    region: t(`region.${region}`, {}, { locale: language }),
    language: t(`languages.${language}`, {}, { locale: language }),
  }, { locale: language })
  const message = ElMessage({
    customClass: 'custom-message-container',
    duration: 0,
    offset: 20,
    type: 'info',
    message: h('div', { class: 'content-box language' }, [
      h('span', { class: 'msg' }, msgTxt),
      h('button', {
        class: 'confirm btn',
        type: 'button',
        onClick: () => {
          store.dispatch('SET_GLOBAL_SETTINGS', { language })
          message.close()
        },
      }, t('confirm', {}, { locale: language })),
    ]),
    showClose: true,
    onClose: () => store.dispatch('SET_GLOBAL_SETTINGS', { languageToggleTip: false }),
  })
}

watch(() => globalSettings.value.language, setLanguage, { immediate: true })
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  setLanguage(globalSettings.value.language)
  setLanguageByIP()
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
