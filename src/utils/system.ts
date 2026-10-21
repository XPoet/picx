import { LanguageEnum } from '@/common/model'

/**
 * 判断系统是否是黑暗模式
 */
export const isDarkModeOfSystem = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 获取系统名称
 * @returns 'mac' | 'win' | 'linux' | null
 */
export const getOSName = (): 'mac' | 'win' | 'linux' | null => {
  const { platform } = navigator
  if (platform.includes('Mac')) {
    return 'mac'
  }
  if (platform.includes('Win')) {
    return 'win'
  }
  if (platform.includes('Linux')) {
    return 'linux'
  }
  return null
}

/**
 * 根据浏览器首选语言获取界面语言，未匹配时使用英文
 */
export const getBrowserLanguage = (): LanguageEnum => {
  const language = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
  const [code, ...subtags] = language.split('-')

  if (code !== 'zh') {
    return LanguageEnum.en
  }

  if (subtags.includes('hans')) {
    return LanguageEnum.zhCN
  }
  if (subtags.some(subtag => ['hant', 'tw', 'hk', 'mo'].includes(subtag))) {
    return LanguageEnum.zhTW
  }
  return LanguageEnum.zhCN
}
