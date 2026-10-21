import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, test } from './management-fixture'

for (const renamed of ['1111.webp', `${'旅行照片'.repeat(20)}.png`]) {
  test(`重命名后文件仅保留一个新名称，属性列表不重复显示名称（长名称：${renamed.length > 20}）`, async ({ page, management }, info) => {
    await management.open()
    await expect(page.locator('.management-content > .el-loading-mask')).toBeHidden()
    const before = await page.locator('.image-card').count()
    await page.route('https://images.example.test/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from(fixturePngBase64, 'base64') }))
    await page.route('https://api.github.com/**', async (route) => {
      const url = new URL(route.request().url())
      const path = decodeURIComponent(url.pathname)
      if (path.endsWith(`/contents/${renamed}`))
        await route.fulfill({ status: 404, json: { message: 'fixture missing' } })
      else if (path.endsWith('/contents/coast.png'))
        await route.fulfill({ json: { path: 'coast.png', type: 'file', sha: 'fixture-coast-sha' } })
      else if (path.endsWith('/branches/master'))
        await route.fulfill({ json: { commit: { sha: 'head', commit: { tree: { sha: 'base' } } } } })
      else if (path.endsWith('/git/trees') || path.endsWith('/git/commits'))
        await route.fulfill({ json: { sha: 'fixture-commit' } })
      else if (path.endsWith('/git/refs/heads/master'))
        await route.fulfill({ json: { object: { sha: 'fixture-commit' } } })
      else await route.fallback()
    })
    const original = page.locator('.image-card').filter({ has: page.locator('.media-filename', { hasText: /^coast\.png$/ }) })
    await original.locator('.media-more').click()
    await page.getByRole('menuitem', { name: '重命名', exact: true }).click()
    const renameDialog = page.getByRole('dialog', { name: '重命名', exact: true })
    await renameDialog.getByRole('textbox').fill(renamed)
    await renameDialog.getByRole('button', { name: /确\s*定/ }).click()
    const filename = page.locator('.media-filename').filter({ hasText: renamed })
    await expect(filename).toHaveCount(1)
    await expect(original).toHaveCount(0)
    await expect(page.locator('.image-card')).toHaveCount(before)
    await filename.click()
    const dialog = page.locator('.media-properties-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(renamed, { exact: true })).toHaveCount(1)
    const rows = dialog.locator('.el-descriptions__body tr')
    await expect(rows).toHaveCount(4)
    await expect(rows.nth(0)).toContainText('文件名称')
    await expect(rows.nth(0)).toContainText(renamed)
    await expect(rows.nth(1)).toContainText('所在目录')
    await expect(rows.nth(1).getByText('/', { exact: true })).toBeVisible()
    await expect(rows.nth(2)).toContainText('文件类型')
    await expect(rows.nth(3)).toContainText('文件大小')
    const bounds = await dialog.boundingBox()
    expect(bounds!.width).toBeLessThanOrEqual(520)
    expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 31)
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    if (renamed.length <= 20) {
      await expect(page.locator('.el-message')).toHaveCount(0)
      await expect(page.locator('.dialog-fade-enter-active')).toHaveCount(0)
      expect((await dialog.boundingBox())!.height).toBeLessThan(420)
      await dialog.screenshot({ path: `/tmp/picx-media-properties-${info.project.name}.png`, animations: 'disabled' })
    }
    await dialog.getByRole('button', { name: /确\s*定/ }).click()
    await expect(dialog).toBeHidden()
  })
}

test('目录内文件属性支持菜单打开、关闭与重新查看', async ({ page, management, isMobile }) => {
  await management.open()
  await page.locator('.folder-card').filter({ has: page.locator('.folder-name', { hasText: /^albums$/ }) }).locator(':scope > button').click()
  const media = page.locator('.image-card').filter({ has: page.locator('.media-filename', { hasText: /^lake\.png$/ }) })
  if (isMobile) {
    await media.locator('.media-more').click()
    await page.getByRole('menuitem', { name: '文件属性', exact: true }).click()
  }
  else {
    await media.click({ button: 'right' })
    await page.locator('.management-context-menu').getByRole('menuitem', { name: '文件属性', exact: true }).click()
  }
  const dialog = page.locator('.media-properties-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('lake.png', { exact: true })).toHaveCount(1)
  await expect(dialog.getByText('/albums', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await media.locator('.media-filename').click()
  await expect(dialog).toBeVisible()
})
