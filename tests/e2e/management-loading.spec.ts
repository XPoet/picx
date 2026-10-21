import { expect, test } from './management-fixture'

function gate() {
  let release = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  return { pending, release }
}

for (const operation of ['media-delete', 'media-rename', 'move', 'directory-delete', 'directory-rename'] as const) {
  test(`${operation} 在接口等待期间显示 loading，失败后可继续操作`, async ({ page, management }) => {
    await management.open()
    await expect(page.locator('.management-content > .el-loading-mask')).toBeHidden()
    const media = page.locator('.image-card').filter({ has: page.locator('.media-filename', { hasText: 'coast.png' }) })
    const folder = page.locator('.folder-card').filter({ has: page.locator('.folder-name', { hasText: /^albums$/ }) })
    const directory = operation.startsWith('directory')
    const target = directory ? folder : media
    const delayed = gate()
    await page.route('https://api.github.com/**', async (route) => {
      const url = new URL(route.request().url())
      if (route.request().method() === 'DELETE' || url.pathname.endsWith('/branches/master') || url.pathname.endsWith('/contents/renamed.png') || url.pathname.endsWith('/contents/albums/coast.png') || url.pathname.endsWith('/contents/renamed')) {
        await delayed.pending
        await route.fulfill({ status: 403, json: { message: 'fixture denied' } })
      }
      else {
        await route.fallback()
      }
    })
    await target.locator(directory ? '.folder-menu button' : '.media-more').click()
    const action = operation.endsWith('delete') ? directory ? '删除整个目录' : '删除' : operation === 'move' ? '移动' : '重命名'
    await page.getByRole('menuitem', { name: action, exact: true }).click()
    const dialog = page.getByRole('dialog').last()
    if (operation.endsWith('rename'))
      await dialog.getByRole('textbox').fill(directory ? 'renamed' : 'renamed.png')
    if (operation === 'move')
      await dialog.getByRole('button', { name: 'albums', exact: true }).click()
    await expect(target.locator(':scope > .el-loading-mask')).toBeHidden()
    await dialog.getByRole('button', { name: /确\s*定/ }).click()
    await expect(target.locator(':scope > .el-loading-mask')).toBeVisible()
    await expect(page.locator('.management-search input')).toBeDisabled()
    if (operation === 'move')
      await expect(dialog.locator('.el-button.is-loading')).toBeVisible()
    delayed.release()
    await expect(target.locator(':scope > .el-loading-mask')).toBeHidden()
    await expect(page.locator('.management-search input')).toBeEnabled()
    if (operation === 'move') {
      await expect(dialog.getByRole('alert')).toBeVisible()
      await expect(dialog.locator('.el-button.is-loading')).toHaveCount(0)
    }
  })
}

test('刷新显示按钮旋转和内容 loading，失败后恢复', async ({ page, management }) => {
  await management.open()
  await expect(page.locator('.management-content > .el-loading-mask')).toBeHidden()
  const delayed = gate()
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.endsWith('/contents/'), async (route) => {
    await delayed.pending
    await route.fulfill({ status: 403, json: { message: 'fixture denied' } })
  })
  const reload = page.locator('.directory-tools .el-button')
  await reload.click()
  await expect(reload).toHaveClass(/is-loading/)
  await expect(reload).toBeDisabled()
  await expect(page.locator('.management-content > .el-loading-mask')).toBeVisible()
  delayed.release()
  await expect(reload).not.toHaveClass(/is-loading/)
  await expect(reload).toBeEnabled()
  await expect(page.locator('.management-content > .el-loading-mask')).toBeHidden()
})

for (const batch of [false, true]) {
  test(`复制链接显示 loading 并恢复（批量：${batch}）`, async ({ page, management }) => {
    await management.open()
    await expect(page.locator('.management-content > .el-loading-mask')).toBeHidden()
    await page.evaluate(() => {
      const state = window as Window & { finishCopy?: () => void }
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise<void>((resolve) => {
        state.finishCopy = resolve
      }) } })
    })
    const media = page.locator('.image-card').filter({ has: page.locator('.media-filename', { hasText: 'coast.png' }) })
    if (batch)
      await media.locator('input[type="checkbox"]').check()
    const copy = batch ? page.locator('.selector-wrapper .el-button').filter({ hasText: '复制所选链接' }) : media.locator('.copy-link')
    await copy.click()
    await expect(copy).toHaveClass(/is-loading/)
    await expect(media.locator(':scope > .el-loading-mask')).toBeVisible()
    await page.evaluate(() => (window as Window & { finishCopy?: () => void }).finishCopy?.())
    await expect(copy).not.toHaveClass(/is-loading/)
    await expect(copy).toBeEnabled()
    await expect(media.locator(':scope > .el-loading-mask')).toBeHidden()
  })
}
