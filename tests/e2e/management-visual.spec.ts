import process from 'node:process'
import { expect, test } from './management-fixture'

test('最终根目录仅文件夹画面，桌面和平板无溢出', async ({ page, management }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await management.open({ scenario: 'folders' })
  await expect(page.getByText('当前目录暂无图片或视频', { exact: true })).toBeVisible()
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T033')
    await page.screenshot({ path: 'docs/UI/evidence/p4/t033-folders-1440.png', fullPage: true })
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('最终混合根目录和目录内批量选择画面', async ({ page, management }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await management.open({ media: true })
  await expect(page.locator('.media-metadata').first()).toContainText('1 × 1')
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T033')
    await page.screenshot({ path: 'docs/UI/evidence/p4/t033-mixed-1440.png', fullPage: true })
  await page.getByTitle('进入文件夹 albums', { exact: true }).click()
  await page.getByRole('checkbox', { name: '选择 lake.png', exact: true }).check()
  await expect(page.locator('.selector-wrapper').getByRole('status')).toContainText('已选 1 / 2 项')
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T033')
    await page.screenshot({ path: 'docs/UI/evidence/p4/t033-album-1440.png', fullPage: true })
})

for (const language of ['en', 'zh-TW'] as const) {
  test(`375px ${language} 暗色可访问卡片与批量工具`, async ({ page, management }, info) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await management.open({ media: true, language, theme: 'dark' })
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.locator('.image-card input[type="checkbox"]').first().check()
    const search = page.getByRole('searchbox')
    await expect(search).toHaveCSS('font-size', '16px')
    for (const button of await page.locator('.image-card .media-more, .image-card .copy-link, .folder-menu button').all()) {
      const box = await button.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
      expect(box?.width).toBeGreaterThanOrEqual(44)
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T033')
      await page.screenshot({ path: `docs/UI/evidence/p4/t033-${language}-dark-375.png`, fullPage: true })
  })
}
