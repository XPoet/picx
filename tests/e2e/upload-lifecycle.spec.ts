import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, openNavigation, test } from './fixtures'
import { mockClipboard, mockUploadRequests } from './upload-fixture'

const select = (page: Page, names: string[]) => page.locator('.getting-images-container input[type=file]').setInputFiles(names.map(name => ({ name, mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })))
async function pasteImage(page: Page) {
  return page.evaluate((base64) => {
    const file = new File([Uint8Array.from(atob(base64), char => char.charCodeAt(0))], 'pasted.png', { type: 'image/png' })
    const transfer = new DataTransfer()
    transfer.items.add(file)
    const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    return event.defaultPrevented
  }, fixturePngBase64)
}
async function navigate(page: Page, name: string) {
  await openNavigation(page)
  await page.getByRole('link', { name, exact: true }).click()
  if (name === '图床设置')
    await expect(page.locator('.settings-page-container')).toBeVisible()
  else if (name === '上传图片')
    await expect(page.locator('.upload-page-container')).toBeVisible()
}

test('快捷键保护输入、弹窗和重复按键，上传锁与重置共用按钮判断', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['a.png', 'b.png'])
  await page.getByRole('button', { name: '更改上传目录', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '配置上传目录', exact: true })
  await dialog.getByText('新建目录', { exact: true }).click()
  const input = dialog.getByLabel('新目录路径', { exact: true })
  await input.fill('keyboard/input')
  await input.press('ControlOrMeta+a')
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([0, 'keyboard/input'.length])
  await input.press('ControlOrMeta+s')
  expect(remote.calls.contents + remote.calls.blob).toBe(0)
  expect(await pasteImage(page)).toBe(false)
  await expect(page.locator('.uploaded-item')).toHaveCount(2)
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.locator('.queue-heading').click()
  expect(await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, repeat: true, bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
  expect(remote.calls.blob).toBe(0)
  remote.holdRef = true
  await page.keyboard.press('ControlOrMeta+s')
  await expect.poll(() => remote.calls.ref).toBe(1)
  await expect(page.getByRole('button', { name: '更改上传目录', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^重置/ })).toBeDisabled()
  await expect(page.locator('.getting-images-container input')).toBeDisabled()
  await expect(page.locator('.upload-image-card-container.confirming')).toHaveCount(2)
  await page.keyboard.press('ControlOrMeta+s')
  expect(remote.calls.ref).toBe(1)
  remote.releaseRef?.()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
  await page.locator('.uploaded-item').first().getByTitle('查看 b.png 的详情', { exact: true }).last().click()
  const details = page.getByRole('dialog', { name: '文件详情', exact: true })
  await expect(details).toBeVisible()
  expect(await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
  await details.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(details).toBeHidden()
  await page.locator('.queue-heading').click()
  await page.keyboard.press('ControlOrMeta+a')
  await expect(page.locator('.uploaded-item')).toHaveCount(0)
  expect(remote.files.size).toBe(2)
})

test('多次进出清理快捷键和粘贴监听，登出后队列与监听不遗留', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['retained.png'])
  for (let index = 0; index < 3; index++) {
    await navigate(page, '图床设置')
    await page.keyboard.press('ControlOrMeta+s')
    expect(await pasteImage(page)).toBe(false)
    await navigate(page, '上传图片')
    await expect(page.locator('.uploaded-item')).toHaveCount(1)
  }
  await page.locator('.queue-heading').click()
  await page.keyboard.press('ControlOrMeta+s')
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(1)
  expect(remote.calls.contents).toBe(1)
  await openNavigation(page)
  await page.getByRole('button', { name: 'fixture-owner 账户菜单', exact: true }).click()
  await page.getByRole('menuitem', { name: '退出登录', exact: true }).click()
  await expect(page.getByLabel('GitHub Token', { exact: true })).toBeVisible()
  const announcement = page.getByRole('dialog', { name: '网站公告', exact: true })
  await expect(announcement).toBeVisible()
  await announcement.getByRole('button', { name: /关闭/ }).click()
  await expect(announcement).toBeHidden()
  expect(await pasteImage(page)).toBe(false)
  await navigate(page, '上传图片')
  await expect(page.locator('.uploaded-item')).toHaveCount(0)
  await page.keyboard.press('ControlOrMeta+s')
  expect(remote.calls.contents).toBe(1)
})

test('离开时取消等待中的请求，晚到已提交内容核验后恢复且不重复提交', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['late-a.png', 'late-b.png'])
  remote.holdRef = true
  await page.getByRole('button', { name: /^上传\s*\(/ }).click()
  await expect.poll(() => remote.calls.ref).toBe(1)
  await navigate(page, '图床设置')
  remote.releaseRef?.()
  await expect.poll(() => remote.files.size).toBe(2)
  await navigate(page, '上传图片')
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(0)
  await page.getByRole('button', { name: /^上传\s*\(/ }).click()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
  expect(remote.calls).toMatchObject({ blob: 2, ref: 1, recovered: 2 })
})

for (const variant of [
  { language: 'en', upload: /^Upload\s*\(/, file: 'Very-long-filename-for-responsive-validation.png', label: 'en-dark' },
  { language: 'zh-TW', upload: /^上傳\s*\(/, file: '繁體中文與長檔名版面驗證.png', label: 'zh-tw-dark' },
] as const) {
  test(`375px ${variant.label} 成功结果与操作均可达`, async ({ page, picx }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 375, height: 812 })
    await mockUploadRequests(page)
    await mockClipboard(page)
    await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true, language: variant.language, theme: 'dark' })
    await select(page, [variant.file])
    await page.getByRole('button', { name: variant.upload }).click()
    await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(1)
    await expect(page.locator('.queue-status')).toContainText(variant.language === 'en' ? 'Uploaded' : '已上傳')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const format = page.locator('.copy-format .el-select__input')
    await expect(format).toHaveCSS('font-size', '16px')
    if (info.project.name === 'desktop-chrome') {
      await expect(page.locator('.el-message')).toHaveCount(0, { timeout: 8000 })
      await page.screenshot({ path: `docs/UI/evidence/p3/t028-${variant.label}-375.png`, fullPage: true })
    }
  })
}

test('文件尚在读取时禁止抢先上传，取消读取不会追加失效文件', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await page.addInitScript(() => {
    const read = FileReader.prototype.readAsDataURL
    FileReader.prototype.readAsDataURL = function (blob: Blob) {
      if (blob instanceof File && blob.name === 'slow.png') {
        document.documentElement.dataset.waitingForFile = 'true'
        window.addEventListener('fixture-release-file', () => read.call(this, blob), { once: true })
      }
      else {
        read.call(this, blob)
      }
    }
  })
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['ready.png'])
  await expect(page.locator('.queue-status')).toContainText('待上传')
  await select(page, ['slow.png'])
  await expect(page.getByRole('status').filter({ hasText: '正在读取所选文件' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^上传\s*\(/ })).toBeDisabled()
  await page.locator('.queue-heading').click()
  await page.keyboard.press('ControlOrMeta+s')
  expect(remote.calls.contents).toBe(0)
  await page.evaluate(() => window.dispatchEvent(new Event('fixture-release-file')))
  await expect(page.locator('.uploaded-item')).toHaveCount(2)
  await page.getByRole('button', { name: /^上传\s*\(/ }).click()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
  await page.getByRole('button', { name: /^重置/ }).click()
  await select(page, ['slow.png'])
  await expect(page.getByRole('status').filter({ hasText: '正在读取所选文件' })).toBeVisible()
  await page.getByRole('button', { name: /^重置/ }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('fixture-release-file')))
  await expect(page.getByRole('status').filter({ hasText: '正在读取所选文件' })).toHaveCount(0)
  await expect(page.locator('.uploaded-item')).toHaveCount(0)
})
