import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'

const png = (name = 'same.png') => ({ name, mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })

test('持续追加同名图片、MP4 与粘贴，输入内不接管粘贴', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await picx.open('/upload', { savedRepository: true, processingDisabled: true })
  const input = page.locator('.getting-images-container input[type=file]')
  await input.setInputFiles(png())
  await expect(page.locator('.uploaded-item')).toHaveCount(1)
  await input.setInputFiles([png(), { name: 'clip.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fixture-mp4') }])
  await expect(page.locator('.uploaded-item')).toHaveCount(3)
  await page.evaluate((base64) => {
    const file = new File([Uint8Array.from(atob(base64), char => char.charCodeAt(0))], 'pasted.png', { type: 'image/png' })
    const clipboard = new DataTransfer()
    clipboard.items.add(file)
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }))
  }, fixturePngBase64)
  await expect(page.locator('.uploaded-item')).toHaveCount(4)
  await expect(page.getByRole('button', { name: '继续选择图片或 MP4', exact: true })).toBeVisible()
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t020-intake-1440.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t020-intake-375.png', fullPage: true })
})
