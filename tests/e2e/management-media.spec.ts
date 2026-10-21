import process from 'node:process'
import { createCloudSettingsFixture } from '../fixtures/ui-redesign'
import { expect, test } from './management-fixture'

test('常驻选择、真实体积与尺寸、键盘预览和菜单', async ({ page, management }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => {
    document.documentElement.dataset.copied = value
  } } }))
  await management.open({ media: true })
  const card = page.getByRole('article', { name: 'coast.png', exact: true })
  await expect(card.getByRole('checkbox')).toBeVisible()
  await expect(card.locator('.media-metadata')).toContainText('1 KB')
  await expect(card.locator('.media-metadata')).toContainText('1 × 1')
  await card.getByRole('checkbox').check()
  await expect(card).toHaveClass(/checked/)
  const preview = card.getByRole('button', { name: '预览 coast.png', exact: true })
  await preview.press('Enter')
  await expect(page.locator('.el-image-viewer__wrapper')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(preview).toBeFocused()
  await card.getByRole('button', { name: '复制链接', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('/coast.png')
  const more = card.getByRole('button', { name: '更多操作：coast.png', exact: true })
  await more.click()
  await expect(page.getByRole('menuitem', { name: '文件属性', exact: true })).toBeVisible()
  await page.getByRole('menuitem', { name: '文件属性', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '属性', exact: true })).toContainText('coast.png')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '属性', exact: true })).toBeHidden()
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T031') {
    await page.screenshot({ path: 'docs/UI/evidence/p4/t031-media-1440.png', fullPage: true })
    await page.setViewportSize({ width: 375, height: 812 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: 'docs/UI/evidence/p4/t031-media-375.png', fullPage: true })
  }
})

test('加载失败可重试，未知元数据省略，完整名称可查看，MP4 不自动播放', async ({ page, management }) => {
  let broken = true
  await page.route('**/broken.png', async (route) => {
    if (broken)
      await route.fulfill({ status: 404, body: '' })
    else await route.fallback()
  })
  await management.open({ media: true })
  const failed = page.getByRole('article', { name: 'broken.png', exact: true })
  await expect(failed.getByText('预览加载失败', { exact: true })).toBeVisible()
  broken = false
  await failed.getByRole('button', { name: '重新加载预览', exact: true }).click()
  await expect(failed.locator('.media-metadata')).toContainText('1 × 1')
  const unknown = page.getByRole('article', { name: 'unknown.png', exact: true })
  await expect(unknown.locator('.media-metadata')).not.toContainText('0 KB')
  await expect(unknown.locator('.media-metadata')).not.toContainText('0 × 0')
  const longName = 'a-very-long-photo-name-that-can-be-opened-in-properties.png'
  await page.getByRole('article', { name: longName, exact: true }).getByRole('button', { name: longName, exact: true }).click()
  await expect(page.getByRole('dialog', { name: '属性', exact: true })).toContainText(longName)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  const video = page.getByRole('article', { name: 'clip.mp4', exact: true }).locator('video')
  await expect(video).not.toHaveAttribute('autoplay')
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)
  const invalidSettings = await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}')
    settings.imageLinkType.presetList[settings.imageLinkType.selected].rule = 'invalid-link'
    localStorage.setItem('PICX_IH_SETTINGS', JSON.stringify(settings))
    return settings
  })
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.endsWith('/contents/.settings'), route => route.fulfill({ json: createCloudSettingsFixture(invalidSettings) }))
  await page.reload()
  const unavailable = page.getByRole('article', { name: 'clip.mp4', exact: true })
  await expect(unavailable).toContainText('链接不可用，请检查链接设置。')
  await expect(unavailable.getByRole('button', { name: '复制链接', exact: true })).toBeDisabled()
})
