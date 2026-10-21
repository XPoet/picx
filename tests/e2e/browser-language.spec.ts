import en from '../../src/locales/en.json'
import zhCN from '../../src/locales/zh-CN.json'
import zhTW from '../../src/locales/zh-TW.json'
import { expect, openNavigation, test } from './fixtures'

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

    test('退出登录并重载后跟随浏览器首选语言', async ({ page, picx }) => {
      // 模拟两种语言 API 不一致，首选列表仍由 context locale 提供。
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'language', { get: () => 'en-US' })
      })
      const savedLanguage = language === 'en' ? 'zh-CN' : 'en'
      const savedMessages = savedLanguage === 'en' ? en : zhCN
      const messages = language === 'zh-CN' ? zhCN : language === 'zh-TW' ? zhTW : en
      await picx.open('/settings', { savedRepository: true, language: savedLanguage })
      await openNavigation(page)
      await page.getByRole('button', { name: savedMessages.header.account_for.replace('{account}', 'fixture-owner'), exact: true }).click()
      await Promise.all([
        page.waitForEvent('domcontentloaded'),
        page.getByRole('menuitem', { name: savedMessages.logout, exact: true }).click(),
      ])
      await expect(page).toHaveURL(/#\/\?jump=0&returnTo=(?:%2F|\/)settings$/)
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page).toHaveTitle(`${title} | PicX`)
      expect(await page.evaluate(() => localStorage.getItem('PICX_IH_CONFIG'))).toBeNull()
      const announcement = page.getByRole('dialog', { name: messages.header.announcement.text_1 })
      await expect(announcement).toBeVisible()
      await expect(announcement.locator('.el-dialog__headerbtn')).toHaveAttribute('aria-label', language === 'zh-CN' ? /关闭/ : language === 'zh-TW' ? /關閉/ : /close/i)
      await page.keyboard.press('Escape')
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page).toHaveTitle(`${title} | PicX`)
    })
  })
}
