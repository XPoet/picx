import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SS_GLOBAL_SETTINGS } from '@/common/constant'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { getBrowserLanguage } from '@/utils/system'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  usePicxStore(pinia).$reset()
})

afterEach(() => vi.restoreAllMocks())

describe('浏览器语言识别', () => {
  it.each([
    ['zh', 'zh-CN'],
    ['zh-CN', 'zh-CN'],
    ['zh-SG', 'zh-CN'],
    ['zh-Hans', 'zh-CN'],
    ['zh-Hans-TW', 'zh-CN'],
    ['ZH-cn', 'zh-CN'],
    ['zh-TW', 'zh-TW'],
    ['zh-HK', 'zh-TW'],
    ['zh-MO', 'zh-TW'],
    ['zh-Hant', 'zh-TW'],
    ['zh-Hant-CN', 'zh-TW'],
    ['ZH-hAnT', 'zh-TW'],
    ['en', 'en'],
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['fr-FR', 'en'],
    ['ja-JP', 'en'],
    ['de-DE', 'en'],
    ['ko-KR', 'en'],
  ])('%s 映射为 %s，并用于 Pinia 默认设置', (language, expected) => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
    expect(getBrowserLanguage()).toBe(expected)
    expect(usePicxStore(createPinia()).getGlobalSettings.language).toBe(expected)
  })

  it('首选语言不受支持时使用英文', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'zh-CN'])
    expect(getBrowserLanguage()).toBe('en')
  })

  it('没有主语言时读取首选列表，列表为空时使用英文', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('')
    const languages = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-TW'])
    expect(getBrowserLanguage()).toBe('zh-TW')
    languages.mockReturnValue([])
    expect(getBrowserLanguage()).toBe('en')
  })

  it('保留会话中的手动语言选择', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
    sessionStorage.setItem(SS_GLOBAL_SETTINGS, JSON.stringify({ language: 'zh-TW' }))
    expect(usePicxStore(createPinia()).getGlobalSettings.language).toBe('zh-TW')
  })
})
