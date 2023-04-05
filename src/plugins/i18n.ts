import { createI18n } from 'vue-i18n'
import zhCN from '@/locales/zhCN.json'
import enUS from '@/locales/enUS.json'

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n
