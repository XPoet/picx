import process from 'node:process'
import { expect, test } from './management-fixture'

const directorySnapshot = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const config = JSON.parse(localStorage.getItem('PICX_IH_CONFIG') ?? '{}')
  return { viewDir: config.viewDir, selectedDir: config.selectedDir, dirMode: config.dirMode }
})

test('根目录、单击与键盘进入、任意父级和返回均不更改上传目标', async ({ page, management }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await management.open({ scenario: 'folders' })
  const back = page.getByRole('button', { name: '返回上级目录', exact: true })
  await expect(back).toBeDisabled()
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  await page.getByRole('button', { name: '进入文件夹 旅行照片与很长的文件夹名称', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('navigation', { name: '目录导航' })).toContainText('旅行照片与很长的文件夹名称')
  expect(await directorySnapshot(page)).toEqual({ viewDir: 'albums/旅行照片与很长的文件夹名称', selectedDir: '/', dirMode: 'rootDir' })
  await back.click()
  expect((await directorySnapshot(page)).viewDir).toBe('albums')
  await page.getByRole('button', { name: '进入文件夹 旅行照片与很长的文件夹名称', exact: true }).click()
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T029')
    await page.screenshot({ path: 'docs/UI/evidence/p4/t029-directory-1440.png', fullPage: true })
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T029')
    await page.screenshot({ path: 'docs/UI/evidence/p4/t029-directory-375.png', fullPage: true })
  await page.getByRole('button', { name: '根目录', exact: true }).click()
  await expect(back).toBeDisabled()
  expect((await directorySnapshot(page)).selectedDir).toBe('/')
})

test('定向上传显式保存当前目录，根目录空态也保存根目标', async ({ page, management }) => {
  await management.open()
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  await page.getByRole('button', { name: '上传到当前目录', exact: true }).click()
  await expect(page).toHaveURL(/#\/upload$/)
  expect(await directorySnapshot(page)).toEqual({ viewDir: 'albums', selectedDir: 'albums', dirMode: 'repoDir' })
  await page.goto('/images-hosting/#/management')
  await page.getByRole('button', { name: '根目录', exact: true }).click()
  await page.getByRole('button', { name: '上传到根目录', exact: true }).first().click()
  await expect(page).toHaveURL(/#\/upload$/)
  expect((await directorySnapshot(page)).selectedDir).toBe('/')
})

test('定向上传存储失败保留浏览目录与原目标', async ({ page, management }) => {
  await management.open()
  await page.getByRole('button', { name: '进入文件夹 empty', exact: true }).click()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'PICX_IH_CONFIG')
        throw new DOMException('Fixture denied', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '上传到当前目录', exact: true }).first().click()
  await expect(page).toHaveURL(/#\/management$/)
  await expect(page.getByRole('alert')).toContainText('上传目录保存失败')
  expect((await directorySnapshot(page)).selectedDir).toBe('/')
})
