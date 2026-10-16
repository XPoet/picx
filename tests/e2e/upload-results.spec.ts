import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { fixturePngBase64 } from '../fixtures/ui-redesign'
import { expect, openNavigation, test } from './fixtures'
import { mockClipboard, mockUploadRequests } from './upload-fixture'

const png = (name: string) => ({ name, mimeType: 'image/png', buffer: Buffer.from(fixturePngBase64, 'base64') })
const select = async (page: Page, names: string[]) => page.locator('.getting-images-container input[type=file]').setInputFiles(names.map(png))
const upload = (page: Page, count: number) => page.getByRole('button', { name: new RegExp(`^上传 ${count} 个文件`) }).click()
const result = (page: Page) => page.getByRole('region', { name: '上传结果', exact: true })

test('成功、复制、实际目录、管理和继续添加，只提交新项', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  await select(page, ['first.png'])
  await expect(page.locator('.uploaded-item').getByRole('status')).toContainText('待上传')
  await upload(page, 1)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  await expect(page.locator('.uploaded-item').getByRole('status')).toContainText('已上传')
  expect(remote.calls.contents).toBe(1)
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('/master/first.png')
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t027-success-1440.png', fullPage: true })
  await page.getByRole('button', { name: '更改上传目录', exact: true }).click()
  const directory = page.getByRole('dialog', { name: '配置上传目录', exact: true })
  await directory.getByRole('radio', { name: '新建目录', exact: true }).check()
  await directory.getByLabel('新目录路径', { exact: true }).fill('later')
  await directory.getByRole('button', { name: '保存目录', exact: true }).click()
  await result(page).getByRole('button', { name: '查看图片管理', exact: true }).click()
  await expect(page).toHaveURL(/#\/management$/)
  expect(await page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('PICX_IH_CONFIG') ?? '{}')
    return { selected: config.selectedDir, view: config.viewDir }
  })).toEqual({ selected: 'later', view: '/' })
  await openNavigation(page)
  await page.getByRole('link', { name: '上传图片', exact: true }).click()
  await expect(page.locator('.uploaded-item')).toHaveCount(1)
  await select(page, ['second.png'])
  await upload(page, 1)
  await expect(result(page)).toContainText('/later')
  expect(remote.calls.contents).toBe(2)
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toContain('/master/later/second.png')
  await page.getByRole('button', { name: '复制全部链接', exact: true }).click()
  const copied = await page.evaluate(() => document.documentElement.dataset.copied)
  expect(copied).toContain('/master/first.png')
  expect(copied).toContain('/master/later/second.png')
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t027-success-375.png', fullPage: true })
  await page.getByRole('button', { name: /^重置/ }).click()
  await expect(page.locator('.uploaded-item')).toHaveCount(0)
  expect(remote.files.size).toBe(2)
})

test('部分 blob 失败只复制成功项，重试仅上传失败项', async ({ page, picx }, info) => {
  const remote = await mockUploadRequests(page, { failBlob: 1 })
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['good.png', 'bad.png'])
  await upload(page, 2)
  await expect(result(page).getByRole('heading')).toHaveText('部分文件未上传')
  await expect(result(page)).toContainText('成功 1 个，失败 1 个')
  const copied = await page.evaluate(() => document.documentElement.dataset.copied)
  expect(copied).toContain('good.png')
  expect(copied).not.toContain('bad.png')
  await page.getByRole('button', { name: '复制全部链接', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).not.toContain('bad.png')
  if (info.project.name === 'desktop-chrome') {
    await page.setViewportSize({ width: 1440, height: 1080 })
    await page.screenshot({ path: 'docs/UI/evidence/p3/t027-partial-1440.png', fullPage: true })
  }
  await upload(page, 1)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  expect(remote.calls).toMatchObject({ blob: 2, ref: 1, contents: 1 })
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
})

test('权限失败保留文件并可恢复，离线阻止上传', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page, { forbidden: true })
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['permission.png'])
  await upload(page, 1)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传未完成')
  await expect(result(page)).toContainText('没有访问权限')
  await expect(page.locator('.uploaded-item')).toHaveCount(1)
  remote.forbidden = false
  await upload(page, 1)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  await select(page, ['offline.png'])
  await page.context().setOffline(true)
  await expect(page.getByRole('alert').filter({ hasText: '当前离线' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^上传 1 个文件/ })).toBeDisabled()
  await page.context().setOffline(false)
  await upload(page, 1)
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
})

test('ref 返回失败没有成功结果；重试先核验已经提交的真实路径', async ({ page, picx }) => {
  const remote = await mockUploadRequests(page, { refFailure: 'after' })
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['a.png', 'b.png'])
  await upload(page, 2)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传未完成')
  expect(await page.evaluate(() => document.documentElement.dataset.copied)).toBeUndefined()
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(0)
  remote.refFailure = undefined
  await upload(page, 2)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  expect(remote.calls).toMatchObject({ blob: 2, ref: 1, recovered: 2 })
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
})

test('复制被拒绝不会反转成功结果，重连返回保留未上传项', async ({ page, picx }) => {
  await mockUploadRequests(page)
  await mockClipboard(page, true)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready', processingDisabled: true })
  await select(page, ['saved.png'])
  await upload(page, 1)
  const copy = page.getByRole('dialog', { name: '复制未完成', exact: true })
  await expect(copy).toBeVisible()
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  await copy.getByRole('button', { name: '重试复制', exact: true }).click()
  await expect(copy).toBeHidden()
  await select(page, ['retained.png'])
  await openNavigation(page)
  await page.getByRole('button', { name: 'fixture-owner 账户菜单', exact: true }).click()
  await page.getByRole('menuitem', { name: '重新连接 GitHub', exact: true }).click()
  await expect(page).toHaveURL(/#\/\?.*returnTo/)
  await page.getByLabel('GitHub Token', { exact: true }).fill('fixture-invalid-credential')
  await page.getByRole('button', { name: '验证并连接', exact: true }).click()
  await expect(page).toHaveURL(/#\/upload$/)
  await expect(page.locator('.uploaded-item')).toHaveCount(2)
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(1)
  await upload(page, 1)
  await expect(page.locator('.upload-image-card-container.uploaded')).toHaveCount(2)
})

test('真实水印与编码 Worker 生成 JPEG，大小、后缀和已压缩结果一致', async ({ page, picx }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  const remote = await mockUploadRequests(page)
  await mockClipboard(page)
  await picx.open('/upload', { savedCredential: true, connectionScenario: 'ready' })
  await expect(page.getByRole('status').filter({ hasText: 'GitHub 已连接' })).toBeVisible()
  await page.getByRole('switch', { name: '自动压缩', exact: true }).press('Space')
  const original = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('Canvas fixture unavailable')
    const pixels = context.createImageData(512, 512)
    let seed = 42
    for (let index = 0; index < pixels.data.length; index += 4) {
      for (let channel = 0; channel < 3; channel++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        pixels.data[index + channel] = seed >>> 24
      }
      pixels.data[index + 3] = 255
    }
    context.putImageData(pixels, 0, 0)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  const bytes = Buffer.from(original, 'base64')
  await page.locator('.getting-images-container input[type=file]').setInputFiles({ name: 'processed.png', mimeType: 'image/png', buffer: bytes })
  await expect(page.locator('.uploaded-item .queue-status')).toContainText('已压缩', { timeout: 20_000 })
  await expect(page.locator('.queue-filename')).toHaveText('processed.jpg')
  await upload(page, 1)
  await expect(result(page).getByRole('heading')).toHaveText('本批上传完成')
  expect(remote.files.get('processed.jpg')?.size).toBeLessThan(bytes.length)
  expect(remote.bytes.get('processed.jpg')?.subarray(0, 2).equals(Buffer.from([0xFF, 0xD8]))).toBe(true)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t027-compressed-1440.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (info.project.name === 'desktop-chrome')
    await page.screenshot({ path: 'docs/UI/evidence/p3/t027-compressed-375.png', fullPage: true })
})
