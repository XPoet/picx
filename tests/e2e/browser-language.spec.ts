import { expect, test } from '@playwright/test'
import en from '../../src/locales/en.json'
import zhCN from '../../src/locales/zh-CN.json'
import zhTW from '../../src/locales/zh-TW.json'

for (const [browserLanguage, language, title] of [
  ['zh-CN', 'zh-CN', zhCN.login],
  ['zh-TW', 'zh-TW', zhTW.login],
  ['en-US', 'en', en.login],
  ['fr-FR', 'en', en.login],
]) {
  test.describe(`浏览器首选语言 ${browserLanguage}`, () => {
    test.use({ locale: browserLanguage })

    test('没有语言设置时自动识别，且不查询 IP', async ({ page }) => {
      const ipRequests: string[] = []
      await page.route(/api\.ipify\.org|ipapi\.co/, (route) => {
        ipRequests.push(route.request().url())
        return route.abort()
      })
      await page.addInitScript(() => {
        sessionStorage.setItem('PICX_IH_GLOBAL_SETTINGS', JSON.stringify({ theme: 'light', showAnnouncement: false }))
      })
      await page.goto('/images-hosting/#/?jump=0')
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page).toHaveTitle(`${title} | PicX`)
      await expect(page.locator('.custom-message-container .language')).toHaveCount(0)
      expect(ipRequests).toEqual([])
    })
  })
}
