import type { Page } from '@playwright/test'
import process from 'node:process'
import { expect, test } from './management-fixture'

async function mediaMenu(page: Page, name: string, action: string) {
  await page.getByRole('article', { name, exact: true }).getByRole('button', { name: `更多操作：${name}`, exact: true }).click()
  await page.getByRole('menuitem', { name: action, exact: true }).click()
}

test('部分删除保留失败项并可重试，指定分支，取消无写入', async ({ page, management }, info) => {
  let fail = true
  const requests: Array<{ path: string, branch: string }> = []
  await page.route('https://api.github.com/**', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback()
      return
    }
    const path = decodeURIComponent(new URL(route.request().url()).pathname.split('/contents/')[1])
    const body = route.request().postDataJSON() as { branch: string }
    requests.push({ path, branch: body.branch })
    if (path === 'broken.png' && fail)
      await route.fulfill({ status: 403, json: { message: 'Fixture denied' } })
    else await route.fulfill({ json: { commit: { sha: `deleted-${path}` } } })
  })
  await management.open({ media: true })
  await page.getByRole('checkbox', { name: '选择 coast.png', exact: true }).check()
  await page.getByRole('checkbox', { name: '选择 broken.png', exact: true }).check()
  await page.getByRole('button', { name: '删除所选媒体', exact: true }).click()
  await page.getByRole('dialog', { name: '删除所选媒体', exact: true }).getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('article', { name: 'coast.png', exact: true })).toHaveCount(0)
  await expect(page.getByRole('article', { name: 'broken.png', exact: true })).toBeVisible()
  await expect(page.locator('.management-error')).toContainText('已删除 1 项，1 项失败')
  expect(requests).toEqual([{ path: 'coast.png', branch: 'master' }, { path: 'broken.png', branch: 'master' }])
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T033') {
    await page.setViewportSize({ width: 1440, height: 1080 })
    await page.screenshot({ path: 'docs/UI/evidence/p4/t033-partial-1440.png', fullPage: true })
    await page.setViewportSize({ width: 375, height: 812 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: 'docs/UI/evidence/p4/t033-partial-375.png', fullPage: true })
  }
  fail = false
  await page.getByRole('button', { name: '重试删除失败项', exact: true }).click()
  await page.getByRole('dialog', { name: '删除所选媒体', exact: true }).getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  expect(requests.at(-1)).toEqual({ path: 'broken.png', branch: 'master' })
})

test('刷新失败保留内容与选择，重试成功按路径和 SHA 核对', async ({ page, management }) => {
  await management.open()
  await page.getByRole('checkbox', { name: '选择 coast.png', exact: true }).check()
  let fail = true
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.endsWith('/contents/'), async (route) => {
    if (fail)
      await route.fulfill({ status: 503, json: { message: 'Fixture service' } })
    else await route.fallback()
  })
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.locator('.management-error')).toContainText('服务暂时不可用')
  await expect(page.getByRole('checkbox', { name: '选择 coast.png', exact: true })).toBeChecked()
  fail = false
  await page.getByRole('button', { name: '重试加载', exact: true }).click()
  await expect(page.locator('.management-error')).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: '选择 coast.png', exact: true })).toBeChecked()
})

test('删除失败后刷新出新 SHA，不把新版本当作失败项重试删除', async ({ page, management }) => {
  const deleted: string[] = []
  await page.route('https://api.github.com/**', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleted.push((route.request().postDataJSON() as { sha: string }).sha)
      await route.fulfill({ status: 403, json: { message: 'denied' } })
    }
    else {
      await route.fallback()
    }
  })
  await management.open()
  await page.getByRole('checkbox', { name: '选择 coast.png', exact: true }).check()
  await page.getByRole('button', { name: '删除所选媒体', exact: true }).click()
  await page.getByRole('dialog', { name: '删除所选媒体', exact: true }).getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('button', { name: '重试删除失败项', exact: true })).toBeVisible()
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.endsWith('/contents/'), route => route.fulfill({ json: [{ type: 'file', name: 'coast.png', path: 'coast.png', sha: 'new-revision', size: 2048 }] }))
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: '选择 coast.png', exact: true })).not.toBeChecked()
  await expect(page.getByRole('button', { name: '重试删除失败项', exact: true })).toHaveCount(0)
  expect(deleted).toEqual(['fixture-coast-sha'])
})

test('媒体重命名 ref 失败保留原名，成功后更新缓存；冲突不覆盖', async ({ page, management }) => {
  let refFail = true
  let destinationExists = false
  let commits = 0
  const trees: Array<Array<{ path: string, sha: string | null }>> = []
  await page.route('https://api.github.com/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.includes('/contents/renamed.png')) {
      await route.fulfill(destinationExists ? { json: { path: 'renamed.png', type: 'file', sha: 'existing' } } : { status: 404, json: { message: 'missing' } })
      return
    }
    if (url.pathname.endsWith('/contents/coast.png')) {
      await route.fulfill({ json: { path: 'coast.png', type: 'file', sha: 'fixture-coast-sha' } })
      return
    }
    if (url.pathname.endsWith('/branches/master')) {
      await route.fulfill({ json: { commit: { sha: 'head', commit: { tree: { sha: 'base' } } } } })
      return
    }
    if (url.pathname.endsWith('/git/trees') && request.method() === 'POST') {
      trees.push((request.postDataJSON() as { tree: Array<{ path: string, sha: string | null }> }).tree)
      await route.fulfill({ json: { sha: 'tree' } })
      return
    }
    if (url.pathname.endsWith('/git/commits')) {
      commits += 1
      await route.fulfill({ json: { sha: 'commit' } })
      return
    }
    if (url.pathname.endsWith('/git/refs/heads/master')) {
      await route.fulfill(refFail ? { status: 403, json: { message: 'denied' } } : { json: { object: { sha: 'commit' } } })
      return
    }
    await route.fallback()
  })
  await management.open()
  for (const attempt of ['ref-failed', 'conflict', 'success']) {
    await mediaMenu(page, 'coast.png', '重命名')
    const dialog = page.getByRole('dialog', { name: '重命名', exact: true })
    await expect(dialog).toContainText('旧链接会失效')
    await dialog.getByRole('textbox').fill('renamed.png')
    await dialog.getByRole('button', { name: '确定', exact: true }).click()
    if (attempt === 'success') {
      await expect(page.getByRole('article', { name: 'renamed.png', exact: true })).toBeVisible()
    }
    else {
      await expect(page.getByRole('article', { name: 'coast.png', exact: true })).toBeVisible()
      await expect(page.getByRole('alert').last()).toContainText(attempt === 'conflict' ? '资源已变化' : '权限')
    }
    if (attempt === 'ref-failed') {
      refFail = false
      destinationExists = true
    }
    else {
      destinationExists = false
    }
  }
  expect(commits).toBe(2)
  expect(trees[0]).toEqual([{ path: 'renamed.png', mode: '100644', type: 'blob', sha: 'fixture-coast-sha' }, { path: 'coast.png', mode: '100644', type: 'blob', sha: null }])
})

test('目录显式菜单含递归影响，右键使用当前对象且可 Esc 关闭', async ({ page, management }) => {
  await management.open()
  await page.getByRole('button', { name: '目录操作：albums', exact: true }).click()
  await page.getByRole('menuitem', { name: '删除整个目录', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '删除整个目录', exact: true })
  await expect(dialog).toContainText('包括未显示的非媒体文件')
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  const coast = page.getByRole('article', { name: 'coast.png', exact: true })
  await coast.click({ button: 'right' })
  const menu = page.locator('.management-context-menu')
  await expect(menu.getByRole('menuitem', { name: '文件属性', exact: true })).toBeVisible()
  await menu.getByRole('menuitem', { name: '文件属性', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '属性', exact: true })).toContainText('coast.png')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  const lake = page.getByRole('article', { name: 'lake.png', exact: true })
  await lake.click({ button: 'right' })
  await menu.getByRole('menuitem', { name: '文件属性', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '属性', exact: true })).toContainText('albums/lake.png')
  await page.keyboard.press('Escape')
  await lake.click({ button: 'right' })
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
})

test('移动弹窗异步选择真实目录，ref 失败保留选择并可重试', async ({ page, management }) => {
  let rejectRef = true
  let moved = false
  const paths: Array<{ path: string, sha: string | null }> = []
  await page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/contents/albums') && moved) {
      await route.fulfill({ json: [{ type: 'file', name: 'coast.png', path: 'albums/coast.png', sha: 'fixture-coast-sha', size: 1024 }, { type: 'file', name: 'lake.png', path: 'albums/lake.png', sha: 'lake', size: 2048 }] })
    }
    else if (url.pathname.endsWith('/contents/albums/coast.png')) {
      await route.fulfill({ status: 404, json: { message: 'missing' } })
    }
    else if (url.pathname.endsWith('/contents/coast.png')) {
      await route.fulfill({ json: { path: 'coast.png', sha: 'fixture-coast-sha', type: 'file' } })
    }
    else if (url.pathname.endsWith('/branches/master')) {
      await route.fulfill({ json: { commit: { sha: 'head', commit: { tree: { sha: 'base' } } } } })
    }
    else if (url.pathname.endsWith('/git/trees')) {
      paths.push(...(route.request().postDataJSON() as { tree: Array<{ path: string, sha: string | null }> }).tree)
      await route.fulfill({ json: { sha: 'tree' } })
    }
    else if (url.pathname.endsWith('/git/commits')) {
      await route.fulfill({ json: { sha: 'commit' } })
    }
    else if (url.pathname.endsWith('/git/refs/heads/master')) {
      moved = !rejectRef
      await route.fulfill(rejectRef ? { status: 403, json: { message: 'denied' } } : { json: { object: { sha: 'commit' } } })
    }
    else {
      await route.fallback()
    }
  })
  await management.open()
  await mediaMenu(page, 'coast.png', '移动')
  const dialog = page.getByRole('dialog', { name: '移动', exact: true })
  await expect(dialog).toContainText('原链接会失效')
  await dialog.getByRole('button', { name: 'albums', exact: true }).click()
  await dialog.getByRole('button', { name: '确定', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('权限')
  await expect(dialog.getByRole('button', { name: 'albums', exact: true })).toHaveAttribute('aria-pressed', 'true')
  rejectRef = false
  await dialog.getByRole('button', { name: '确定', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('article', { name: 'coast.png', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  await expect(page.getByRole('article', { name: 'coast.png', exact: true })).toBeVisible()
  expect(paths).toContainEqual({ path: 'albums/coast.png', sha: 'fixture-coast-sha', mode: '100644', type: 'blob' })
})

test('嵌套目录重命名和递归删除在 ref 确认后更新树，非媒体文件包含在影响内', async ({ page, management }) => {
  const nested = 'albums/旅行照片与很长的文件夹名称'
  const trees: Array<Array<{ path: string, sha: string | null }>> = []
  await page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/contents/albums/renamed')) {
      await route.fulfill({ status: 404, json: { message: 'missing' } })
    }
    else if (url.pathname.endsWith('/branches/master')) {
      await route.fulfill({ json: { commit: { sha: 'head', commit: { tree: { sha: 'base' } } } } })
    }
    else if (url.pathname.endsWith('/git/trees/base')) {
      await route.fulfill({ json: { sha: 'base', truncated: false, tree: [{ path: `${nested}/mountain.png`, sha: 'mountain', type: 'blob', mode: '100644' }, { path: 'albums/readme.txt', sha: 'readme', type: 'blob', mode: '100644' }] } })
    }
    else if (url.pathname.endsWith('/git/trees')) {
      trees.push((route.request().postDataJSON() as { tree: Array<{ path: string, sha: string | null }> }).tree)
      await route.fulfill({ json: { sha: 'tree' } })
    }
    else if (url.pathname.endsWith('/git/commits')) {
      await route.fulfill({ json: { sha: 'commit' } })
    }
    else if (url.pathname.endsWith('/git/refs/heads/master')) {
      await route.fulfill({ json: { object: { sha: 'commit' } } })
    }
    else {
      await route.fallback()
    }
  })
  await management.open()
  await page.getByRole('button', { name: '进入文件夹 albums', exact: true }).click()
  await page.getByRole('button', { name: '目录操作：旅行照片与很长的文件夹名称', exact: true }).click()
  await page.getByRole('menuitem', { name: '重命名', exact: true }).click()
  const rename = page.getByRole('dialog', { name: '重命名', exact: true })
  await rename.getByRole('textbox').fill('renamed')
  await rename.getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('button', { name: '进入文件夹 renamed', exact: true })).toBeVisible()
  expect(trees[0]).toContainEqual({ path: 'albums/renamed/mountain.png', sha: 'mountain', mode: '100644', type: 'blob' })
  await page.getByRole('button', { name: '根目录', exact: true }).click()
  await page.getByRole('button', { name: '目录操作：albums', exact: true }).click()
  await page.getByRole('menuitem', { name: '删除整个目录', exact: true }).click()
  await page.getByRole('dialog', { name: '删除整个目录', exact: true }).getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('button', { name: '进入文件夹 albums', exact: true })).toHaveCount(0)
  expect(trees[1]).toContainEqual({ path: 'albums/readme.txt', sha: null, mode: '100644', type: 'blob' })
})
