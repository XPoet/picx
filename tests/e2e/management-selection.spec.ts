import process from 'node:process'
import { expect, test } from './management-fixture'

test('全选与半选有明确范围，排序保留选择，筛选清空，复制和删除一致', async ({ page, management }, info) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  const deleted: string[] = []
  await page.route('https://api.github.com/**', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleted.push(decodeURIComponent(new URL(route.request().url()).pathname.split('/contents/')[1]))
      await route.fulfill({ json: { commit: { sha: 'fixture-delete' }, content: null } })
    }
    else {
      await route.fallback()
    }
  })
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => {
    document.documentElement.dataset.copied = text
  } } }))
  await management.open({ media: true })
  const all = page.getByRole('checkbox', { name: '全选当前目录媒体（4 项）', exact: true })
  await page.getByRole('checkbox', { name: '选择 coast.png', exact: true }).check()
  await expect(all).toBeChecked({ indeterminate: true })
  await expect(page.getByRole('status')).toContainText('已选 1 / 4 项')
  await page.getByRole('combobox', { name: '排序', exact: true }).press('Enter')
  await page.getByRole('option', { name: '名称降序', exact: true }).click()
  await expect(page.getByRole('listbox')).toBeHidden()
  await expect(page.getByRole('checkbox', { name: '选择 coast.png', exact: true })).toBeChecked()
  await all.check()
  await expect(page.getByRole('status')).toContainText('已选 4 / 4 项')
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T032') {
    await page.screenshot({ path: 'docs/UI/evidence/p4/t032-selection-1440.png', fullPage: true })
    await page.setViewportSize({ width: 375, height: 812 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: 'docs/UI/evidence/p4/t032-selection-375.png', fullPage: true })
  }
  await page.getByRole('searchbox').fill('coast')
  await expect(page.getByRole('checkbox', { name: '选择 coast.png', exact: true })).not.toBeChecked()
  await page.getByRole('checkbox', { name: '全选当前结果（1 项）', exact: true }).check()
  await page.getByRole('button', { name: '复制所选链接', exact: true }).click()
  const copied = await page.evaluate(() => document.documentElement.dataset.copied ?? '')
  expect(copied.split('\n')).toHaveLength(1)
  expect(copied).toContain('/coast.png')
  await page.getByRole('button', { name: '删除所选媒体', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: '删除所选媒体', exact: true })
  await expect(dialog).toContainText('所选的 1 个媒体文件')
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  expect(deleted).toEqual([])
  await page.getByRole('button', { name: '删除所选媒体', exact: true }).click()
  dialog = page.getByRole('dialog', { name: '删除所选媒体', exact: true })
  await dialog.getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('article', { name: 'coast.png', exact: true })).toHaveCount(0)
  expect(deleted).toEqual(['coast.png'])
  await page.getByRole('button', { name: '清空搜索', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(3)
})
