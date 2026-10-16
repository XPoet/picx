import { expect, openNavigation, test } from './fixtures'

const languages = [
  { value: 'zh-CN', trigger: '选择语言', option: '中文简体', theme: '主题', announcement: '网站公告', title: '上传图片', update: 'zh_CN', close: /关闭/ },
  { value: 'zh-TW', trigger: '選擇語言', option: '中文繁体', theme: '主題', announcement: '網站公告', title: '上傳圖片', update: 'zh_TW', close: /關閉/ },
  { value: 'en', trigger: 'Choose language', option: '英文', theme: 'Theme', announcement: 'Website Announcement', title: 'Upload Image', update: 'en_US', close: /close/i },
] as const

for (const language of languages) {
  test(`语言 ${language.value} 同步页面、Element Plus 和更新通知`, async ({ page, picx }) => {
    await picx.open('/upload', { language: language.value === 'zh-CN' ? 'en' : 'zh-CN' })
    await page.evaluate(() => {
      const plugin = window.pluginWebUpdateNotice_
      if (!plugin) {
        throw new Error('Production update notification plugin must be available')
      }
      const setLocale = plugin.setLocale.bind(plugin)
      plugin.setLocale = (locale) => {
        document.documentElement.dataset.updateLocale = locale
        setLocale(locale)
      }
    })
    await openNavigation(page)
    await page.getByRole('button', { name: language.value === 'zh-CN' ? 'Choose language' : '选择语言', exact: true }).click()
    await page.getByRole('menuitemradio', { name: language.value === 'zh-CN' ? 'Simplified Chinese' : language.option, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', language.value)
    await expect(page).toHaveTitle(new RegExp(language.title))
    await expect(page.locator('html')).toHaveAttribute('data-update-locale', language.update)
    await page.getByRole('button', { name: language.announcement, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.el-dialog__headerbtn')).toHaveAttribute('aria-label', language.close)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
}

test('亮暗与系统主题持久化，系统变化实时更新', async ({ page, picx }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await picx.open('/?jump=0', { theme: 'system' })
  await expect(page.locator('html')).toHaveClass('light')
  for (const [label, theme] of [['暗夜', 'dark'], ['白昼', 'light'], ['跟随系统', 'system']]) {
    await openNavigation(page)
    await page.getByRole('button', { name: '主题', exact: true }).click()
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('PICX_IH_GLOBAL_SETTINGS') ?? '{}').theme)).toBe(theme)
    await expect(page.locator('html')).toHaveClass(theme === 'dark' ? 'dark' : 'light')
  }
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass('dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass('light')
})

test('账户互斥显示真实身份，重连进入登录并保留站内恢复目标', async ({ page, picx }) => {
  await picx.open('/settings', { savedRepository: true })
  await openNavigation(page)
  await expect(page.getByRole('link', { name: '开始使用', exact: true })).toHaveCount(0)
  const account = page.getByRole('button', { name: 'fixture-owner 账户菜单', exact: true })
  await account.focus()
  await account.press('Enter')
  const profile = page.getByRole('menuitem', { name: 'GitHub 主页', exact: true })
  await expect(profile).toBeFocused()
  await expect(profile).toHaveAttribute('href', 'https://github.com/fixture-owner')
  await page.keyboard.press('Escape')
  await expect(account).toBeFocused()
  await account.press('Enter')
  await page.keyboard.press('ArrowDown')
  const reconnect = page.getByRole('menuitem', { name: '重新连接 GitHub', exact: true })
  await expect(reconnect).toBeFocused()
  await reconnect.press('Enter')
  await expect(page).toHaveURL(/#\/\?jump=0&returnTo=(?:%2F|\/)settings$/)
  await expect(page.getByRole('main').getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
})

test('登出清理 fixture 并进入实际登录入口', async ({ page, picx }) => {
  await picx.open('/settings', { savedRepository: true })
  await openNavigation(page)
  await page.getByRole('button', { name: 'fixture-owner 账户菜单', exact: true }).click()
  await page.getByRole('menuitem', { name: '退出登录', exact: true }).click()
  await expect(page).toHaveURL(/#\/\?jump=0&returnTo=(?:%2F|\/)settings$/)
  await expect(page.getByRole('main').getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('PICX_IH_CONFIG'))).toBeNull()
  await expect(page.getByRole('dialog', { name: '网站公告' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '网站公告' })).toBeHidden()
  await openNavigation(page)
  await expect(page.getByRole('link', { name: '开始使用', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'fixture-owner 账户菜单', exact: true })).toHaveCount(0)
})

test('只有可安装事件出现后才提供 PWA 安装，安装后隐藏', async ({ page, picx }) => {
  await picx.open('/?jump=0')
  await openNavigation(page)
  await expect(page.getByRole('button', { name: '安装 PicX', exact: true })).toHaveCount(0)
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, {
      prompt: async () => { document.documentElement.dataset.pwaPrompted = 'true' },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(event)
  })
  await page.getByRole('button', { name: '安装 PicX', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-pwa-prompted', 'true')
  await expect(page.getByRole('button', { name: '安装 PicX', exact: true })).toHaveCount(0)
})
