import { expect, test } from './fixtures'

test('复制被拒绝后展示安全文本并可重试', async ({ page, picx }, info) => {
  await page.addInitScript(() => {
    let rejected = false
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => {
      if (!rejected) {
        rejected = true
        throw new DOMException('fixture', 'NotAllowedError')
      }
      document.documentElement.dataset.copied = text
    } } })
  })
  await picx.open('/management', { savedRepository: true })
  const copy = page.locator('.image-card .copy-link').first()
  await copy.click()
  const dialog = page.getByRole('dialog', { name: '复制未完成', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: '待复制文本' })).toBeFocused()
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t023-copy-1280.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(dialog.getByRole('button', { name: '重试复制', exact: true })).toBeInViewport()
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t023-copy-375.png', fullPage: true })
  await expect(dialog.getByRole('textbox', { name: '待复制文本' })).toHaveValue(/^https:\/\/images\.example\.test\//)
  await expect(dialog.locator('img')).toHaveCount(0)
  await dialog.getByRole('button', { name: '重试复制', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('https://images.example.test/')
})
