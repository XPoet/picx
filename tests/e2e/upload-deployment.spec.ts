import { Buffer } from 'node:buffer'
import en from '../../src/locales/en.json'
import zhCN from '../../src/locales/zh-CN.json'
import zhTW from '../../src/locales/zh-TW.json'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'
import { mockUploadRequests } from './upload-fixture'

const scenarios = [
  { phase: 'available', language: 'zh-CN', theme: 'light' },
  { phase: 'not-deployed', language: 'zh-CN', theme: 'light' },
  { phase: 'waiting', language: 'zh-CN', theme: 'light' },
  { phase: 'missing-time', language: 'zh-CN', theme: 'light' },
  { phase: 'forbidden', language: 'zh-CN', theme: 'light' },
  { phase: 'available', language: 'zh-TW', theme: 'dark' },
  { phase: 'available', language: 'en', theme: 'light' },
] as const
const locales = { 'zh-CN': zhCN, 'zh-TW': zhTW, en }

for (const { phase, language, theme } of scenarios) {
  test(`上传设置部署区 ${phase} / ${language} / ${theme}`, async ({ page, picx }, info) => {
    const messages = locales[language]
    let deployedAt = '2026-10-20T08:30:00Z'
    await mockUploadRequests(page)
    await page.route('**/git/ref/heads/gh-pages*', route => route.fulfill(phase === 'not-deployed'
      ? { status: 404, json: { message: 'Not Found' } }
      : { json: { object: { sha: 'fixture-current-commit' } } }))
    await page.route('https://api.github.com/repos/**/pages**', (route) => {
      if (phase === 'forbidden')
        return route.fulfill({ status: 403, json: { message: 'Forbidden' } })
      if (new URL(route.request().url()).pathname.endsWith('/builds/latest'))
        return route.fulfill({ json: { status: 'built', commit: phase === 'waiting' ? 'fixture-old-commit' : 'fixture-current-commit', ...(phase === 'missing-time' ? {} : { updated_at: deployedAt }) } })
      return route.fulfill({ json: { status: 'built', html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } })
    })
    await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true, settingsWritable: true, language, theme })
    const panel = page.locator('.upload-settings-panel')
    const deployment = panel.locator('.deploy-status-bar')
    await expect(deployment).toHaveCount(0)
    await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: 'deployment.png', mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
    await panel.getByRole('button', { name: new RegExp(`^${messages.upload}\\s*\\(`) }).click()
    const available = phase === 'available' || phase === 'missing-time'
    await expect(deployment.locator('.deployment-state')).toHaveText(available ? messages.deployment.deployed : phase === 'forbidden' ? messages.deployment.failed : messages.deployment[phase])
    const button = deployment.getByRole('button')
    const mac = await page.evaluate(() => navigator.platform.includes('Mac'))
    await expect(button).toContainText(available ? messages.deployment.redeploy : messages.upload_workspace.deploy)
    await expect(button).toContainText(`(${mac ? '⌘' : 'Ctrl'} + D)`)
    if (phase === 'available') {
      await expect(deployment.locator('time')).toHaveAttribute('datetime', deployedAt)
      await expect(deployment.locator('time')).not.toHaveText('')
      await expect(deployment.locator('.deployment-time')).toContainText(messages.deployment.last_deployed)
      await expect(button).toBeEnabled()
      await panel.screenshot({ path: info.outputPath('upload-settings-deployed.png') })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (language === 'zh-CN') {
        await button.click()
        await expect(page.locator('.el-message-box')).toBeVisible()
        await page.getByRole('button', { name: messages.cancel, exact: true }).click()
        await expect(page.locator('.el-message-box')).toBeHidden()
        await page.locator('body').click({ position: { x: 5, y: 5 } })
        await page.keyboard.press(mac ? 'Meta+d' : 'Control+d')
        await expect(page.locator('.el-message-box')).toBeVisible()
        await page.getByRole('button', { name: messages.cancel, exact: true }).click()
        await expect(page.locator('.el-message-box')).toBeHidden()
        await page.evaluate(() => window.dispatchEvent(new Event('offline')))
        await expect(button).toBeDisabled()
        await page.keyboard.press(mac ? 'Meta+d' : 'Control+d')
        await expect(page.locator('.el-message-box')).toBeHidden()
        await page.evaluate(() => window.dispatchEvent(new Event('online')))
        deployedAt = '2026-10-23T06:00:00Z'
        await page.evaluate(() => window.location.hash = '/settings')
        await expect(page.locator('.deployment-settings time')).toHaveAttribute('datetime', deployedAt)
        await page.evaluate(() => window.location.hash = '/upload')
        await expect(deployment.locator('time')).toHaveAttribute('datetime', deployedAt)
      }
    }
    else if (phase === 'missing-time') {
      await expect(deployment.locator('.deployment-time')).toContainText(messages.deployment.time_unavailable)
      await expect(deployment.locator('time')).toHaveCount(0)
    }
    else {
      await expect(deployment.locator('.deployment-time')).toHaveCount(0)
    }
    await panel.getByRole('button', { name: new RegExp(`^${messages.reset}`) }).click()
    await expect(deployment).toHaveCount(0)
  })
}
