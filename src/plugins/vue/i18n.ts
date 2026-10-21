import { createI18n } from 'vue-i18n'
import zhCN from '@/locales/zh-CN.json'
import zhTW from '@/locales/zh-TW.json'
import en from '@/locales/en.json'
import { getBrowserLanguage } from '@/utils/system'

const i18n = createI18n({
  locale: getBrowserLanguage(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    en
  }
})

export default i18n
