import process from 'node:process'
import { expect, test } from './fixtures'

test('设置页三个分区直接浏览，四档宽度与英文暗色完整显示', async ({ page, picx }, info) => {
  await picx.open('/settings', { savedRepository: true })
  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 900 })
    for (const name of ['上传处理', '链接与分享', 'GitHub Pages 部署与自定义域名'])
      await expect(page.getByRole('heading', { name, exact: true })).toBeAttached()
    await expect(page.locator('.el-collapse')).toHaveCount(0)
    const columns = await page.locator('.settings-grid').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(width < 768 ? 1 : 2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.PICX_CAPTURE_TASK === 'T034' && info.project.name === 'desktop-chrome')
      await page.screenshot({ path: `docs/UI/evidence/p5/t034-settings-${width}.png`, fullPage: true })
  }
})

test('设置页英文暗色在 375px 完整显示', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await picx.open('/settings', { savedRepository: true, language: 'en', theme: 'dark' })
  await expect(page.getByRole('heading', { name: 'Upload processing', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.PICX_CAPTURE_TASK === 'T034' && info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p5/t034-settings-en-dark-375.png', fullPage: true })
})
