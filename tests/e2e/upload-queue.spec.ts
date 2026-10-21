import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'

const png = (name: string) => ({ name, mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
test('轻量队列支持长名、同名、大量文件、视频与键盘详情编辑', async ({ page, picx }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 1080 })
  await picx.open('/upload', { savedRepository: true, processingDisabled: true })
  const long = 'a-very-long-filename-for-layout-validation.with.multiple.parts.png'
  await page.locator('.getting-images-container input[type=file]').setInputFiles([
    ...Array.from({ length: 20 }, (_, index) => png(`photo-${index}.png`)),
    png('same.png'),
    png('same.png'),
    { name: 'clip.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fixture-video') },
    png(long),
  ])
  await expect(page.locator('.uploaded-item')).toHaveCount(24)
  const row = page.locator('.uploaded-item').first()
  await expect(row.getByRole('status')).toContainText('待上传')
  const details = row.getByTitle(`查看 ${long} 的详情`, { exact: true }).last()
  await details.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: '文件详情', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('checkbox', { name: '重命名', exact: true }).press('Space')
  await dialog.getByRole('textbox', { name: '新文件名（不含扩展名）' }).fill('edited')
  await dialog.getByRole('button', { name: '保存文件名', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(row.locator('.queue-filename')).toHaveText('edited.png')
  await expect(row.getByRole('button', { name: '移除 edited.png', exact: true })).toHaveCSS('width', '28px')
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t025-queue-1440.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await row.getByRole('button', { name: '移除 edited.png', exact: true }).click()
  await expect(page.locator('.uploaded-item')).toHaveCount(23)
  await page.getByTitle('查看 clip.mp4 的详情', { exact: true }).click()
  await expect(dialog.locator('video')).toHaveAttribute('controls', '')
  await dialog.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(dialog).toBeHidden()
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t025-queue-375.png', fullPage: true })
})
