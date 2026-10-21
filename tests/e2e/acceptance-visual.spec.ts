import type { Page, TestInfo } from '@playwright/test'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './management-fixture'
import { mockClipboard, mockUploadRequests } from './upload-fixture'

async function capture(page: Page, info: TestInfo, name: string) {
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T041')
    await page.screenshot({ path: `docs/UI/evidence/p6/t041-${name}.png`, fullPage: true })
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('T041 登录双卡片、品牌与 72px 胶囊导航', async ({ page, picx }, info) => {
  await picx.open('/')
  await expect(page.getByLabel('GitHub Token', { exact: true })).toBeVisible()
  await expect(page.locator('.connection-card')).toHaveCount(2)
  await expect(page.locator('.header-content-box')).toHaveCSS('height', '72px')
  await capture(page, info, '01-login-1440')
})

test('T041 上传空态、上下文和目录四模式与异常补充状态', async ({ page, picx }, info) => {
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready' })
  await expect(page.locator('.repository-context .repository-name')).toBeVisible()
  await expect(page.locator('.upload-page-container')).toHaveCSS('grid-template-columns', '920px 320px')
  await expect(page.locator('.upload-stage')).toHaveCSS('height', '408px')
  await capture(page, info, '02-upload-empty-1440')
  await page.getByRole('button', { name: '更改上传目录', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '配置上传目录', exact: true })
  await expect(dialog.locator('.el-dialog')).toHaveCSS('width', '760px')
  for (const [index, mode] of ['仓库目录', '根目录', '日期目录', '新建目录'].entries()) {
    await dialog.locator('.directory-modes').getByText(mode, { exact: true }).click()
    if (mode === '仓库目录') {
      await expect(dialog.getByRole('button', { name: 'albums', exact: true })).toBeVisible()
    }
    if (mode === '新建目录') {
      await dialog.getByLabel('新目录路径', { exact: true }).fill('a/b/c/d/e/f')
      await expect(dialog.getByRole('alert')).toBeVisible()
    }
    await capture(page, info, `03-directory-${index}-1440`)
  }
  await dialog.getByText('仓库目录', { exact: true }).click()
  await dialog.getByRole('button', { name: '展开目录 empty', exact: true }).click()
  await expect(dialog.getByText('此目录没有子目录，可选择上级目录或新建目录。', { exact: true })).toBeVisible()
  await capture(page, info, '03-directory-empty-1440')
  let release: (() => void) | undefined
  const held = new Promise<void>(resolve => release = resolve)
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.includes('/contents/'), async (route) => {
    await held
    await route.fulfill({ status: 503, json: { message: 'fixture failure' } })
  })
  await dialog.getByRole('button', { name: '刷新目录', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '刷新目录', exact: true })).toBeDisabled()
  await capture(page, info, '03-directory-loading-1440')
  release?.()
  await expect(dialog.getByRole('alert').filter({ hasText: '服务暂时不可用' })).toBeVisible()
  await capture(page, info, '03-directory-failure-1440')
})

test('T041 待上传队列、处理 Worker 与完成结果', async ({ page, picx }, info) => {
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready' })
  await expect(page.locator('.repository-context .repository-name')).toBeVisible()
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('Canvas fixture unavailable')
    context.fillStyle = '#476FAF'
    context.fillRect(0, 0, 512, 512)
    context.fillStyle = '#FFFFFF'
    context.fillRect(96, 96, 320, 320)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.getByRole('switch', { name: '自动压缩', exact: true }).press('Space')
  await page.locator('.getting-images-container input[type=file]').setInputFiles([
    { name: 'processed.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') },
    { name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') },
  ])
  await expect(page.locator('.uploaded-item')).toHaveCount(2)
  await expect(page.getByRole('button', { name: /^上传\s*\(/ })).toBeEnabled({ timeout: 20_000 })
  await expect(page.locator('.upload-stage')).toHaveCSS('grid-template-columns', '280px 624px')
  await capture(page, info, '04-queue-1440')
  await page.getByRole('button', { name: /^上传\s*\(/ }).click()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
  expect(remote.calls.ref).toBe(1)
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
  await capture(page, info, '05-uploaded-1440')
})

for (const scenario of ['folders', 'mixed'] as const) {
  test(`T041 管理 ${scenario} 与目录内选择`, async ({ page, management }, info) => {
    await management.open({ scenario })
    await expect(page.getByTitle('进入文件夹 albums', { exact: true })).toBeVisible()
    await expect(page.locator('.image-card')).toHaveCount(scenario === 'folders' ? 0 : 1)
    await capture(page, info, `06-management-${scenario}-1440`)
    if (scenario === 'mixed') {
      await page.getByTitle('进入文件夹 albums', { exact: true }).click()
      await page.getByRole('checkbox', { name: '选择 lake.png', exact: true }).check()
      await expect(page.locator('.selector-wrapper').getByRole('status')).toContainText('已选 1 / 2 项')
      await capture(page, info, '07-management-selected-1440')
    }
  })
}

test('T041 设置三分区与内容自适应双列', async ({ page, picx }, info) => {
  await picx.open('/settings', { savedRepository: true })
  for (const name of ['上传处理', '链接与分享', 'GitHub Pages 部署与自定义域名'])
    await expect(page.getByRole('heading', { name, exact: true })).toBeAttached()
  await expect(page.locator('.settings-grid').first()).toHaveCSS('grid-template-columns', '620px 620px')
  await capture(page, info, '08-settings-1440')
})
