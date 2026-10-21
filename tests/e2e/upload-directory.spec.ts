import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

test.use({ timezoneId: 'Asia/Shanghai' })
const dialogFor = (page: Page) => page.getByRole('dialog', { name: '配置上传目录', exact: true })
const snapshot = (page: Page) => page.evaluate(() => {
  const config = JSON.parse(localStorage.getItem('PICX_IH_CONFIG') ?? '{}')
  return { dirMode: config.dirMode, selectedDir: config.selectedDir, selectedDirList: config.selectedDirList, viewDir: config.viewDir }
})
async function openDirectory(page: Page) {
  await page.getByRole('button', { name: '更改上传目录', exact: true }).click()
  await expect(dialogFor(page)).toBeVisible()
  return dialogFor(page)
}

test('四模式保存并回显，五层路径与预览一致', async ({ page, picx }) => {
  await picx.open('/upload', { savedRepository: true })
  let dialog = await openDirectory(page)
  await dialog.getByText('新建目录', { exact: true }).click()
  const input = dialog.getByLabel('新目录路径', { exact: true })
  await input.fill(' a/b/c/d/e/f ')
  await expect(dialog.getByRole('alert')).toHaveText('目录最多支持 5 层，请缩短路径。')
  await input.fill(' 相 册.v1/a/b/c/d ')
  await expect(dialog.getByTestId('directory-preview')).toHaveText('/相 册.v1/a/b/c/d')
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(await snapshot(page)).toEqual({ dirMode: 'newDir', selectedDir: '相 册.v1/a/b/c/d', selectedDirList: ['相 册.v1', 'a', 'b', 'c', 'd'], viewDir: '/' })
  await expect(page.locator('.repository-directory')).toHaveText('/相 册.v1/a/b/c/d')
  dialog = await openDirectory(page)
  await expect(dialog.getByRole('radio', { name: '新建目录', exact: true })).toBeChecked()
  await expect(dialog.getByLabel('新目录路径', { exact: true })).toHaveValue('相 册.v1/a/b/c/d')
  await dialog.getByText('日期目录', { exact: true }).click()
  await expect(dialog.getByTestId('directory-preview')).toHaveText(/^\/\d{8}$/)
  const datePath = await dialog.getByTestId('directory-preview').textContent()
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(page.locator('.repository-directory')).toHaveText(datePath ?? '')
  dialog = await openDirectory(page)
  await dialog.getByText('仓库目录', { exact: true }).click()
  await dialog.getByRole('button', { name: 'albums', exact: true }).click()
  await dialog.getByRole('button', { name: '展开目录 albums', exact: true }).click()
  await expect(dialog.getByText('此目录没有子目录，可选择上级目录或新建目录。', { exact: true })).toBeVisible()
  await expect(dialog.getByTestId('directory-preview')).toHaveText('/albums')
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(page.locator('.repository-directory')).toHaveText('/albums')
  dialog = await openDirectory(page)
  await dialog.getByRole('radiogroup').getByText('根目录', { exact: true }).click()
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  expect(await snapshot(page)).toEqual({ dirMode: 'rootDir', selectedDir: '/', selectedDirList: [], viewDir: '/' })
})

test('取消、关闭、Esc、遮罩均放弃草稿并返回入口焦点', async ({ page, picx }) => {
  await picx.open('/upload', { savedRepository: true })
  const initial = await snapshot(page)
  for (const method of ['cancel', 'close', 'escape', 'backdrop']) {
    const dialog = await openDirectory(page)
    await dialog.getByText('新建目录', { exact: true }).click()
    await dialog.getByLabel('新目录路径', { exact: true }).fill(`discard/${method}`)
    if (method === 'cancel')
      await dialog.getByRole('button', { name: '取消', exact: true }).click()
    else if (method === 'close')
      await dialog.locator('.el-dialog__headerbtn').click()
    else if (method === 'escape')
      await page.keyboard.press('Escape')
    else await dialog.click({ position: { x: 4, y: 4 } })
    await expect(dialog).toBeHidden()
    expect(await snapshot(page)).toEqual(initial)
    await expect(page.getByRole('button', { name: '更改上传目录', exact: true })).toBeFocused()
  }
})

test('保存失败保留草稿与原目录，恢复存储后可重试', async ({ page, picx }) => {
  await picx.open('/upload', { savedRepository: true })
  await page.evaluate(() => {
    document.documentElement.dataset.rejectDirectory = '1'
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'PICX_IH_CONFIG' && document.documentElement.dataset.rejectDirectory === '1')
        throw new DOMException('Fixture storage unavailable', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  const dialog = await openDirectory(page)
  await dialog.getByText('新建目录', { exact: true }).click()
  await dialog.getByLabel('新目录路径', { exact: true }).fill('blocked/new')
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(dialog.getByRole('alert')).toHaveText('目录保存失败，请检查浏览器存储权限后重试。草稿已保留。')
  await expect(dialog.getByLabel('新目录路径', { exact: true })).toHaveValue('blocked/new')
  expect((await snapshot(page)).selectedDir).toBe('/')
  await page.evaluate(() => document.documentElement.removeAttribute('data-reject-directory'))
  await dialog.getByRole('button', { name: '保存目录', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.repository-directory')).toHaveText('/blocked/new')
})

test('目录刷新失败保留选择和列表，重试与空目录有独立反馈', async ({ page, picx }) => {
  let failNext = false
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.endsWith('/contents/'), async (route) => {
    if (failNext) {
      failNext = false
      await route.fulfill({ status: 503, json: { message: 'not shown' } })
    }
    else {
      await route.fallback()
    }
  })
  await picx.open('/upload', { savedRepository: true })
  const dialog = await openDirectory(page)
  await dialog.getByText('仓库目录', { exact: true }).click()
  await dialog.getByRole('button', { name: 'albums', exact: true }).click()
  failNext = true
  await dialog.getByRole('button', { name: '刷新目录', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('服务暂时不可用')
  await expect(dialog.getByRole('button', { name: 'albums', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByTestId('directory-preview')).toHaveText('/albums')
  await dialog.getByRole('button', { name: '重试加载', exact: true }).click()
  await expect(dialog.getByRole('alert')).toHaveCount(0)
  await dialog.getByRole('button', { name: '展开目录 empty', exact: true }).click()
  await expect(dialog.getByText('此目录没有子目录，可选择上级目录或新建目录。', { exact: true })).toBeVisible()
})

test('760px 弹窗、375px 低高度与键盘输入不触发上传快捷键', async ({ page, picx }) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await picx.open('/upload', { savedRepository: true })
  const dialog = await openDirectory(page)
  await expect(dialog.locator('.el-dialog')).toHaveCSS('width', '760px')
  await dialog.getByText('仓库目录', { exact: true }).click()
  await dialog.getByRole('button', { name: 'albums', exact: true }).click()
  await dialog.getByRole('button', { name: '展开目录 albums', exact: true }).click()
  await page.setViewportSize({ width: 375, height: 480 })
  await dialog.getByText('新建目录', { exact: true }).click()
  const input = dialog.getByLabel('新目录路径', { exact: true })
  await input.fill('keyboard/edit')
  await input.press('ControlOrMeta+a')
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([0, 'keyboard/edit'.length])
  await expect(input).toHaveCSS('font-size', '16px')
  await expect(dialog.getByRole('button', { name: '保存目录', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await input.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.locator('.repository-directory')).toHaveText('/keyboard/edit')
})

test('375px 英文暗色弹窗保留可访问的底部操作', async ({ page, picx }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await picx.open('/upload', { savedRepository: true, language: 'en', theme: 'dark' })
  await page.getByRole('button', { name: 'Change upload directory', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Configure upload directory', exact: true })
  await dialog.getByText('Create New Directory', { exact: true }).click()
  await dialog.getByLabel('New directory path', { exact: true }).fill('albums/long-directory-name')
  await expect(dialog.getByRole('button', { name: 'Save directory', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
