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
import { getLanguageByRegion, getRegionByIP, setWindowTitle, throttle } from '@/utils'
import { ElementPlusSizeEnum, LanguageEnum } from '@/common/model'
import MainContainer from '@/views/main-container/main-container.vue'
import router from '@/router'
import { initGithubAuthorize } from '@/views/picx-login/picx-login.util'

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

const setLanguage = (language: LanguageEnum) => {
  if (language === LanguageEnum.zhCN) {
    elementPlusLocale.value = zhCN // 设置 Element Plus 组件库语言
    instance!.proxy!.$i18n.locale = 'zh-CN' // 设置 i18n 语言
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
  setWindowTitle(router.currentRoute.value.meta.title as string)
}

const setLanguageByIP = () => {
  getRegionByIP().then((region) => {
    const language = getLanguageByRegion(region)

    if (language !== userSettings.language) {
      const confirmTxt = instance?.proxy?.$t(`confirm`, language)
      const msgTxt = instance?.proxy?.$t(`toggle_language_msg`, language, {
        region: instance?.proxy?.$t(`region.${region}`, language),
        language: instance?.proxy?.$t(`language.${language}`, language)
      })

      const msgInstance = ElMessage({
        customClass: 'custom-message-container',
        duration: 0,
        offset: 20,
        type: 'info',
        message: `<div class="content-box language">
                    <span class="msg">${msgTxt}</span>
                    <spna class="btn-box">
                      <span class="confirm btn">${confirmTxt}</span>
                    </spna>
                  </div>`,
        dangerouslyUseHTMLString: true,
        showClose: true
      })

      document
        .querySelector('.custom-message-container .language .confirm')
        ?.addEventListener('click', () => {
          setLanguage(language)
          store.dispatch('SET_USER_SETTINGS', {
            language
          })
          msgInstance.close()
        })
    }
  })
}

const initSetLanguage = () => {
  // 初始化设置
  setLanguage(userSettings.language)

  // 根据 IP 自动设置
  setLanguageByIP()
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
  initSetLanguage()
  initGithubAuthorize()
}

watch(
  () => userSettings.language,
  (language: LanguageEnum) => {
    setLanguage(language)
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
