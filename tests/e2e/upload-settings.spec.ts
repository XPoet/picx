import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, openNavigation, test } from './fixtures'
import { mockClipboard, mockUploadRequests } from './upload-fixture'

test('上传成功后可切换链接格式，压缩偏好在两页同步，重置后隐藏格式', async ({ page, picx }) => {
  await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true, settingsWritable: true })
  const panel = page.locator('.upload-settings-panel')
  const format = panel.getByRole('combobox')
  await expect(format).toHaveCount(0)
  const upload = panel.getByRole('button', { name: /^上传\s*\(/ })
  await expect(upload).toBeDisabled()
  await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: 'format.png', mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
  await upload.click()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(1)
  await expect(format).toBeVisible()
  for (const [name, enabled] of [['BBCode', true], ['原始 URL', false]] as const) {
    await panel.locator('.copy-format .el-select').click()
    await page.getByRole('option', { name, exact: true }).click()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').imageLinkFormat.enable)).toBe(enabled)
  }
  await panel.getByRole('switch', { name: '自动压缩', exact: true }).press('Space')
  await openNavigation(page)
  await page.getByRole('link', { name: '图床设置', exact: true }).click()
  const compression = page.getByRole('switch', { name: '是否压缩图片', exact: true })
  await expect(compression).toBeChecked()
  await compression.press('Space')
  await openNavigation(page)
  await page.getByRole('link', { name: '上传图片', exact: true }).click()
  await expect(page.getByRole('switch', { name: '自动压缩', exact: true })).not.toBeChecked()
  await panel.getByRole('button', { name: /^重置/ }).click()
  await expect(format).toHaveCount(0)
  await expect(page.locator('.workspace-deployment')).toHaveCount(0)
})
