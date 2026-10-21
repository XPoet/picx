import { Buffer } from 'node:buffer'
import { expect, openNavigation, test } from './fixtures'

test('顶部导航按实际路由激活，品牌返回连接引导并支持浏览器返回', async ({ page, picx }) => {
  await picx.open('/settings', { savedRepository: true })
  await openNavigation(page)
  const nav = page.locator('#picx-primary-navigation')
  await expect(nav.getByRole('link', { name: '图床设置', exact: true, includeHidden: true })).toHaveClass(/active/)
  await nav.getByRole('link', { name: '首页', exact: true }).click()
  await expect(page).toHaveURL(/#\/\?jump=0$/)
  await expect(page.getByRole('main').getByRole('button', { name: '验证并连接', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/#\/settings$/)
  await page.getByRole('link', { name: 'PicX 图床首页' }).click()
  await expect(page).toHaveURL(/#\/\?jump=0$/)
})

test('375px 菜单支持键盘打开、Esc 关闭与焦点返回', async ({ page, picx }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await picx.open('/?jump=0')
  const toggle = page.locator('.nav-content-container .menu-toggle')
  await expect(toggle).toHaveAccessibleName('打开导航菜单')
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#picx-primary-navigation')).toBeVisible()
  await expect(page.locator('#picx-primary-navigation').getByRole('link', { name: '首页', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#picx-primary-navigation').getByRole('link', { name: '上传图片', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#picx-primary-navigation')).toBeHidden()
  await expect(toggle).toBeFocused()
  await toggle.press('Enter')
  await page.locator('#picx-primary-navigation').getByRole('link', { name: '上传图片', exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.locator('#picx-primary-navigation')).toBeHidden()
  await expect(toggle).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('图片处理平台显示外链图标，键盘新开标签页并关闭窄屏菜单', async ({ page, picx }) => {
  await picx.open('/?jump=0')
  await openNavigation(page)
  const link = page.locator('#picx-primary-navigation').getByRole('link', { name: '一站式图片处理平台', exact: true })
  await expect(link).toHaveAttribute('href', 'https://picx.xpoet.cn')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(link.locator('svg use')).toHaveAttribute('href', /#external-link$/)
  await page.context().route('https://picx.xpoet.cn/', route => route.fulfill({ body: '<title>PicX</title>' }))
  const originalURL = page.url()
  const popupPromise = page.context().waitForEvent('page')
  await link.press('Enter')
  const popup = await popupPromise
  await popup.waitForLoadState()
  expect(popup.url()).toBe('https://picx.xpoet.cn/')
  expect(await popup.evaluate(() => window.opener)).toBeNull()
  await popup.close()
  expect(page.url()).toBe(originalURL)
  const toggle = page.locator('.nav-content-container .menu-toggle')
  if (await toggle.isVisible()) {
    await expect(page.locator('#picx-primary-navigation')).toBeHidden()
    await expect(toggle).toBeFocused()
  }
})

test('页脚帮助和反馈外链可用，支持键盘新开标签页', async ({ page, picx }) => {
  await picx.open('/upload')
  const footer = page.getByRole('contentinfo')
  const help = footer.getByRole('link', { name: '帮助中心', exact: true })
  const feedback = footer.getByRole('link', { name: '意见反馈', exact: true })
  await expect(help).toHaveAttribute('href', 'https://picx-docs.xpoet.cn')
  await expect(help).toHaveAttribute('rel', 'noopener noreferrer')
  await help.focus()
  await page.keyboard.press('Tab')
  await expect(feedback).toBeFocused()
  await expect(feedback).toHaveAttribute('href', 'https://github.com/XPoet/picx/issues')
  await expect(feedback).toHaveAttribute('rel', 'noopener noreferrer')
  await page.context().route('https://github.com/XPoet/picx/issues', route => route.fulfill({ body: '<title>Feedback</title>' }))
  const originalURL = page.url()
  const popupPromise = page.context().waitForEvent('page')
  await feedback.press('Enter')
  const popup = await popupPromise
  await popup.waitForLoadState()
  expect(popup.url()).toBe('https://github.com/XPoet/picx/issues')
  expect(await popup.evaluate(() => window.opener)).toBeNull()
  await popup.close()
  expect(page.url()).toBe(originalURL)
  await expect(footer.getByRole('link')).toHaveCount(2)
})

test('长英文设置使用文档主滚动，五档宽度和低高度窗口均可访问页尾', async ({ page, picx }) => {
  await picx.open('/settings', { savedRepository: true, language: 'en' })
  await expect(page.locator('.settings-section')).toHaveCount(3)
  for (const [width, height] of [[375, 812], [768, 900], [1024, 900], [1280, 900], [1440, 1080], [1024, 400]]) {
    await page.setViewportSize({ width, height })
    const feedback = page.getByRole('contentinfo').getByRole('link', { name: 'Feedback', exact: true })
    await feedback.scrollIntoViewIfNeeded()
    await expect(feedback).toBeInViewport()
    const metrics = await page.evaluate(() => ({
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
      scrolls: document.documentElement.scrollHeight > innerHeight,
      mainOverflow: getComputedStyle(document.querySelector('main') ?? document.body).overflowY,
      pageOverflow: getComputedStyle(document.querySelector('.settings-page-container') ?? document.body).overflowY,
    }))
    expect(metrics.noOverflow, `No page overflow at ${width}px`).toBe(true)
    expect(metrics.scrolls).toBe(true)
    expect(metrics.mainOverflow).toBe('visible')
    expect(metrics.pageOverflow).toBe('visible')
    if (width === 375) {
      const heights = await page.locator('.settings-section .el-select__wrapper').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
      expect(heights.length).toBeGreaterThan(0)
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
      const description = page.locator('.img-encoder-group .desc').first()
      await expect(description).toHaveCSS('white-space', 'normal')
      expect(await description.evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true)
    }
  }
})

test('375px 已选队列保持显示且可滚动，新增文件仍可访问', async ({ page, picx }) => {
  await page.setViewportSize({ width: 375, height: 600 })
  await picx.open('/upload', { savedRepository: true, processingDisabled: true })
  await page.locator('input[type="file"]').setInputFiles(Array.from({ length: 8 }, (_, index) => ({
    name: `fixture-${index}.svg`,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="blue"/></svg>'),
  })))
  const queue = page.locator('.upload-page-left')
  await expect(queue).toBeVisible()
  await expect(queue.locator('.upload-image-card-container')).toHaveCount(8)
  expect(await queue.locator('.el-scrollbar__wrap').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  const scroll = queue.locator('.el-scrollbar__wrap')
  await scroll.focus()
  await page.keyboard.press('End')
  await expect.poll(() => scroll.evaluate(element => element.scrollTop > 0)).toBe(true)
  const uploadArea = page.locator('.getting-images-container')
  await uploadArea.scrollIntoViewIfNeeded()
  await expect(uploadArea).toBeInViewport()
  await expect(uploadArea.locator('input[type="file"]')).toHaveAttribute('accept', 'image/*,video/mp4')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('低高度公告弹窗可完整操作，图片预览覆盖顶栏', async ({ page, picx }) => {
  await page.setViewportSize({ width: 375, height: 480 })
  await picx.open('/management', { savedRepository: true })
  await openNavigation(page)
  await page.getByRole('button', { name: '网站公告', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '不再提示', exact: true })).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.keyboard.press('Escape')
  await page.locator('.image-card .image-preview').first().click()
  const viewer = page.locator('.el-image-viewer__wrapper')
  await expect(viewer).toBeVisible()
  expect(await viewer.evaluate(element => Number(getComputedStyle(element).zIndex))).toBeGreaterThanOrEqual(3000)
  expect(await page.evaluate(() => Boolean(document.elementFromPoint(innerWidth / 2, 40)?.closest('.el-image-viewer__wrapper')))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
})
