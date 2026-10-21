import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'
import { mockClipboard, mockUploadRequests } from './upload-fixture'

test('T043 五档宽度与低高度下主页面及关键操作完整', async ({ page, picx }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true, language: 'en' })
  for (const [width, height] of [[375, 812], [768, 1024], [1024, 900], [1280, 900], [1440, 1080], [375, 400]]) {
    await page.setViewportSize({ width, height })
    for (const route of ['/upload', '/management', '/settings', '/?jump=0']) {
      await page.goto(`/images-hosting/#${route}`)
      await expect(page.getByRole('main')).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const feedback = page.getByRole('contentinfo').getByRole('link', { name: 'Feedback', exact: true })
      await feedback.scrollIntoViewIfNeeded()
      await expect(feedback).toBeInViewport()
    }
    if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T043')
      await page.screenshot({ path: `docs/UI/evidence/p6/t043-login-${width}-${height}.png`, fullPage: true })
    if (width === 375)
      await expect(page.getByLabel('GitHub Token', { exact: true })).toHaveCSS('font-size', '16px')
  }
})

test('T043 键盘完成连接、目录、上传、复制、管理和弹窗焦点闭环', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockClipboard(page)
  await mockUploadRequests(page)
  await picx.open('/?jump=0', { connectionScenario: 'ready', processingDisabled: true })
  const token = page.getByLabel('GitHub Token', { exact: true })
  await token.focus()
  await page.keyboard.type('fixture-invalid-credential')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  const configure = page.getByRole('button', { name: '更改上传目录', exact: true })
  await configure.focus()
  await page.keyboard.press('Enter')
  const directory = page.getByRole('dialog', { name: '配置上传目录', exact: true })
  await expect(directory).toBeVisible()
  for (let step = 0; step < 12; step++) {
    await page.keyboard.press(step < 6 ? 'Tab' : 'Shift+Tab')
    expect(await directory.evaluate(element => element.contains(document.activeElement))).toBe(true)
  }
  await directory.getByRole('radio', { name: '新建目录', exact: true }).focus()
  await page.keyboard.press('Space')
  await directory.getByLabel('新目录路径', { exact: true }).focus()
  await page.keyboard.type('keyboard/path')
  await page.keyboard.press('Escape')
  await expect(directory).toBeHidden()
  await expect(configure).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(directory).toBeVisible()
  await expect(directory.getByRole('radio', { name: '根目录', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(directory.getByRole('button', { name: '保存目录', exact: true })).toBeEnabled()
  await directory.getByRole('button', { name: '保存目录', exact: true }).press('Enter')
  await expect(directory).toBeHidden()
  await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: 'keyboard.png', mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
  const upload = page.getByRole('button', { name: /^上传 1 个文件/ })
  await expect(upload).toBeEnabled()
  await upload.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: '上传结果', exact: true })).toContainText('本批上传完成')
  await page.getByRole('button', { name: '复制全部链接', exact: true }).press('Enter')
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('keyboard.png')
  await page.getByRole('button', { name: '查看图片管理', exact: true }).press('Enter')
  await expect(page.locator('.image-card')).toHaveCount(2)
  await page.getByRole('checkbox', { name: '选择 keyboard.png', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.selector-wrapper').getByRole('status')).toContainText('已选 1 / 2 项')
  await page.getByRole('button', { name: '复制所选链接', exact: true }).press('Enter')
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('keyboard.png')
  const targets = await page.locator('.media-more, .copy-link, .media-checkbox').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
  for (const target of targets) {
    expect(target.width).toBeGreaterThanOrEqual(44)
    expect(target.height).toBeGreaterThanOrEqual(44)
  }
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T043') {
    await expect(page.locator('.el-message')).toHaveCount(0, { timeout: 15_000 })
    await page.screenshot({ path: 'docs/UI/evidence/p6/t043-keyboard-management-375.png', fullPage: true })
  }
})

for (const theme of ['light', 'dark'] as const) {
  test(`T043 ${theme} 实际语义 Token 对比度与减少动态效果`, async ({ page, picx }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await picx.open('/settings', { savedRepository: true, theme })
    const ratios = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      const luminance = (token: string) => {
        let hex = style.getPropertyValue(`--picx-color-${token}`).trim().slice(1)
        if (hex.length === 3)
          hex = [...hex].map(value => value.repeat(2)).join('')
        const channels = [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }
      return [['text', 'surface'], ['text-muted', 'surface'], ['text-muted', 'surface-muted'], ['primary', 'surface'], ['on-primary', 'primary'], ['success', 'success-soft'], ['warning', 'warning-soft'], ['danger', 'danger-soft'], ['focus', 'surface'], ['control-border', 'surface']].map(([foreground, background]) => {
        const a = luminance(foreground)
        const b = luminance(background)
        return { foreground, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), minimum: ['focus', 'control-border'].includes(foreground) ? 3 : 4.5 }
      })
    })
    for (const sample of ratios)
      expect(sample.ratio, `${sample.foreground} / ${sample.background}`).toBeGreaterThanOrEqual(sample.minimum)
    const control = page.getByRole('button', { name: '保存并部署', exact: true })
    await control.focus()
    await expect(control).toHaveCSS('outline-style', 'solid')
    expect(await control.evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.01)
    if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T043')
      await writeFile(`docs/UI/evidence/p6/t043-contrast-${theme}.json`, JSON.stringify(ratios, null, 2))
  })
}
