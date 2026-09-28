<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import zhTW from 'element-plus/es/locale/lang/zh-tw'
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import { useCloudSettingsSync } from '@/composables/use-cloud-settings-sync'
import router from '@/router'
import { useStore } from '@/stores'
import { getLanguageByRegion, getRegionByIP, setWindowTitle, throttle } from '@/utils'
import setThemeMode from '@/utils/set-theme-mode'
import MainContainer from '@/views/main-container/main-container.vue'
import { initGithubAuthorize } from '@/views/picx-login/picx-login.util'

const { locale, t } = useI18n()
const store = useStore()
// 图床设置后台静默云同步（登录后拉取云端 .settings，本地修改后自动推送）
useCloudSettingsSync()
const globalSettings = computed(() => store.getters.getGlobalSettings).value
const elementPlusSize = shallowRef<ElementPlusSizeEnum>(ElementPlusSizeEnum.default)
const elementPlusLocale = shallowRef(zhCN)

const elementPlusSizeHandle = (width: number) => {
  if (width <= 700) {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.small,
      folded: true,
    })
    elementPlusSize.value = ElementPlusSizeEnum.small
  }
  else if (width <= 1000) {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.default,
      folded: false,
    })
    elementPlusSize.value = ElementPlusSizeEnum.default
  }
  else {
    store?.dispatch('SET_GLOBAL_SETTINGS', {
      elementPlusSize: ElementPlusSizeEnum.large,
      folded: false,
    })
    elementPlusSize.value = ElementPlusSizeEnum.large
  }
}

const setLanguage = (language: LanguageEnum) => {
  if (language === LanguageEnum.zhCN) {
    locale.value = 'zh-CN'
    elementPlusLocale.value = zhCN // 设置 Element Plus 组件库语言
    window.pluginWebUpdateNotice_?.setLocale('zh_CN')
  }
  else if (language === LanguageEnum.zhTW) {
    locale.value = 'zh-TW'
    elementPlusLocale.value = zhTW
    window.pluginWebUpdateNotice_?.setLocale('zh_TW')
  }
  else if (language === LanguageEnum.en) {
    locale.value = 'en'
    elementPlusLocale.value = en
    window.pluginWebUpdateNotice_?.setLocale('en_US')
  }
  else {
    elementPlusLocale.value = zhCN
    locale.value = 'zh-CN'
    window.pluginWebUpdateNotice_?.setLocale('zh_CN')
  }
  setWindowTitle(router.currentRoute.value.meta.title as string)
}

const setLanguageByIP = () => {
  if (!store.getters.getGlobalSettings.languageToggleTip) {
    return
  }

  getRegionByIP().then((region) => {
    const language = getLanguageByRegion(region)

    if (language !== globalSettings.language) {
      const confirmTxt = t('confirm', {}, { locale: language })
      const msgTxt = t(
        'toggle_language_msg',
        {
          region: t(`region.${region}`, {}, { locale: language }),
          language: t(`languages.${language}`, {}, { locale: language }),
        },
        { locale: language },
      )

      const msgInstance = ElMessage({
        customClass: 'custom-message-container',
        duration: 0,
        offset: 20,
        type: 'info',
        message: `<div class="content-box language">
                    <span class="msg">${msgTxt}</span>
                    <span class="btn-box">
                      <span class="confirm btn">${confirmTxt}</span>
                    </span>
                  </div>`,
        dangerouslyUseHTMLString: true,
        showClose: true,
        onClose() {
          store.dispatch('SET_GLOBAL_SETTINGS', {
            languageToggleTip: false,
          })
        },
      })

      document
        .querySelector('.custom-message-container .language .confirm')
        ?.addEventListener('click', () => {
          setLanguage(language)
          store.dispatch('SET_USER_SETTINGS', {
            language,
          })
          store.dispatch('SET_GLOBAL_SETTINGS', {
            language,
          })
          msgInstance.close()
        })
    }
  })
}

const initSetLanguage = () => {
  // 初始化设置
  setLanguage(globalSettings.language)

  // 根据 IP 自动设置
  setLanguageByIP()
}

const init = () => {
  elementPlusSizeHandle(window.innerWidth)
  window.addEventListener(
    'resize',
    throttle((e: any) => {
      elementPlusSizeHandle(e.target.innerWidth)
    }, 600),
  )

  setThemeMode()
  initSetLanguage()
  initGithubAuthorize()
}

watch(
  () => globalSettings.language,
  (language: LanguageEnum) => {
    setLanguage(language)
  },
)

onMounted(() => {
  init()
})
</script>

<template>
  <ElConfigProvider :size="elementPlusSize" :z-index="3000" :locale="elementPlusLocale">
    <MainContainer />
  </ElConfigProvider>
</template>
