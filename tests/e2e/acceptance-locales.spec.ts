import { Buffer } from 'node:buffer'
import process from 'node:process'
import en from '../../src/locales/en.json'
import zhCN from '../../src/locales/zh-CN.json'
import zhTW from '../../src/locales/zh-TW.json'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, openNavigation, test } from './fixtures'

const locales = { 'zh-CN': zhCN, 'zh-TW': zhTW, en }
for (const language of ['zh-CN', 'zh-TW', 'en'] as const) {
  for (const theme of ['light', 'dark', 'system'] as const) {
    test(`T042 ${language} / ${theme} 跨页面、长内容与 200% 等效重排`, async ({ page, picx }) => {
      const messages = locales[language]
      await page.setViewportSize({ width: 1440, height: 1080 })
      await page.emulateMedia({ colorScheme: theme === 'light' ? 'light' : 'dark', reducedMotion: 'reduce' })
      await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true, settingsWritable: true, language, theme })
      await expect(page.locator('html')).toHaveClass(theme === 'light' ? 'light' : 'dark')
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      const longName = `${'very-long-filename-'.repeat(4)}照片.png`
      await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: longName, mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
      await expect(page.locator('.queue-filename')).toHaveAttribute('title', longName)
      await page.getByRole('button', { name: messages.repository_context.configure, exact: true }).click()
      const dialog = page.getByRole('dialog', { name: messages.upload_directory.title, exact: true })
      await dialog.getByRole('radio', { name: messages.config_page.create_new_dir, exact: true }).check()
      const path = Array.from({ length: 5 }, (_, index) => `${index}-${'long-directory-'.repeat(3)}`).join('/')
      await dialog.getByLabel(messages.upload_directory.new_path, { exact: true }).fill(path)
      await expect(dialog.getByTestId('directory-preview')).toHaveText(`/${path}`)
      await dialog.getByRole('button', { name: messages.upload_directory.save, exact: true }).click()
      await expect(dialog).toBeHidden()
      await expect(page.locator('.repository-path summary')).toHaveText(`/${path}`)
      await page.locator('.repository-path summary').click()
      await expect(page.locator('.repository-path p')).toHaveText(`/${path}`)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.PICX_CAPTURE_TASK === 'T042')
        await page.screenshot({ path: `docs/UI/evidence/p6/t042-${language}-${theme}-upload.png`, fullPage: true })
      for (const route of ['/settings', '/management', '/?jump=0']) {
        await page.goto(`/images-hosting/#${route}`)
        await expect(page.getByRole('main')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
      await expect(page.getByLabel(messages.connection.token_label, { exact: true })).toBeVisible()
      await openNavigation(page)
      await page.getByRole('button', { name: messages.header.announcement.text_1, exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await page.goto('/images-hosting/#/settings')
      // 1440px 显示区在 200% 缩放下等效 720 CSS px。原生浏览器缩放另存手工证据。
      await page.setViewportSize({ width: 720, height: 540 })
      await expect(page.locator('.settings-grid').first()).toHaveCSS('grid-template-columns', '688px')
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByRole('button', { name: messages.domain_settings.save, exact: true }).scrollIntoViewIfNeeded()
      await expect(page.getByRole('button', { name: messages.domain_settings.save, exact: true })).toBeInViewport()
      if (process.env.PICX_CAPTURE_TASK === 'T042')
        await page.screenshot({ path: `docs/UI/evidence/p6/t042-${language}-${theme}-reflow.png`, fullPage: true })
      if (theme === 'system') {
        await page.emulateMedia({ colorScheme: 'light' })
        await expect(page.locator('html')).toHaveClass('light')
        await page.emulateMedia({ colorScheme: 'dark' })
        await expect(page.locator('html')).toHaveClass('dark')
      }
    })
  }
}
