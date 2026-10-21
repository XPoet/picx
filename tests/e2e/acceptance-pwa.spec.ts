import type { Page } from '@playwright/test'
import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

test.use({ serviceWorkers: 'allow' })

async function openPwa(page: Page, baseURL: string | undefined) {
  if (!baseURL)
    throw new Error('Preview URL required')
  const origin = new URL(baseURL).origin
  await page.context().route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'))
  await page.context().addInitScript((config) => {
    sessionStorage.setItem('PICX_IH_GLOBAL_SETTINGS', JSON.stringify({ language: 'zh-CN', theme: 'light', showAnnouncement: false }))
    localStorage.setItem('PICX_IH_CONFIG', JSON.stringify(config))
  }, createRepositoryFixture())
  await page.goto('/images-hosting/#/?jump=0')
  await expect(page.getByLabel('GitHub Token', { exact: true })).toBeVisible()
  await page.evaluate(async () => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

async function cachedURLs(page: Page) {
  return page.evaluate(async () => {
    const entries = await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))
    return entries.flat().sort()
  })
}

test('T047 生产 manifest、实际 SW 控制、离线打开与恢复提示', async ({ page, baseURL }, info) => {
  await openPwa(page, baseURL)
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel=manifest]')
    if (!link)
      throw new Error('Production manifest missing')
    const response = await fetch(link.href)
    return response.json() as Promise<{ name: string, scope: string, start_url: string, display: string, icons: { src: string, sizes: string }[] }>
  })
  expect(manifest.name).toBe('PicX')
  expect(manifest.scope).toBe('/images-hosting/')
  expect(manifest.start_url).toBe('/images-hosting/')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map(icon => icon.sizes)).toEqual(['192x192', '512x512'])
  const urls = await cachedURLs(page)
  expect(urls.length).toBeGreaterThan(10)
  expect(urls.some(url => /api\.github\.com|apis\.xpoet\.cn|\.settings|authorization/i.test(url))).toBe(false)
  await page.goto('/images-hosting/#/upload')
  await expect(page.locator('.upload-page-container')).toBeVisible()
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.locator('.upload-page-container')).toBeVisible()
  await expect(page.locator('.workspace-notice').filter({ hasText: '当前离线' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^上传\s*\(/ })).toBeDisabled()
  if (info.project.name === 'desktop-chrome' && process.env.PICX_CAPTURE_TASK === 'T047') {
    await page.screenshot({ path: 'docs/UI/evidence/p6/t047-offline-upload.png', fullPage: true })
    await writeFile('docs/UI/evidence/p6/t047-manifest-cache.json', JSON.stringify({ manifest, cachedResources: urls.length, remoteCredentialsCached: false }, null, 2))
  }
  await page.context().setOffline(false)
  await expect(page.locator('.workspace-notice').filter({ hasText: '当前离线' })).toHaveCount(0)
  await expect(page.locator('.upload-settings-panel').getByRole('button', { name: '重试同步', exact: true })).toBeEnabled()
})

test('T047 两次实际构建之间的 SW 激活与旧资源缓存升级', async ({ page, baseURL }, info) => {
  test.skip(process.env.PICX_PWA_UPDATE !== '1' || info.project.name !== 'desktop-chrome', '须在其余 E2E 结束后单独运行，避免构建切换影响其他用例')
  test.setTimeout(120_000)
  await openPwa(page, baseURL)
  const before = await cachedURLs(page)
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    sessionStorage.setItem('PICX_P6_SW_EVENTS', '[]')
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        const events: string[] = JSON.parse(sessionStorage.getItem('PICX_P6_SW_EVENTS') ?? '[]')
        events.push(worker.state)
        sessionStorage.setItem('PICX_P6_SW_EVENTS', JSON.stringify(events))
      })
    })
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.setItem('PICX_P6_SW_CONTROLLER_CHANGED', '1'))
  })
  const result = await promisify(execFile)('pnpm', ['--config.verifyDepsBeforeRun=false', 'build'], { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 })
  await writeFile('/private/tmp/picx-p6-t047-rebuild.log', `${result.stdout}\n${result.stderr}`)
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update())
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('PICX_P6_SW_EVENTS') ?? '[]') as string[]), { timeout: 30_000 }).toContain('activated')
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('PICX_P6_SW_CONTROLLER_CHANGED')), { timeout: 10_000 }).toBe('1')
  await expect.poll(async () => JSON.stringify(await cachedURLs(page)), { timeout: 10_000 }).not.toBe(JSON.stringify(before))
  const after = await cachedURLs(page)
  const removed = before.filter(url => !after.includes(url))
  const added = after.filter(url => !before.includes(url))
  expect(removed.length).toBeGreaterThan(0)
  expect(added.length).toBeGreaterThan(0)
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.getByLabel('GitHub Token', { exact: true })).toBeVisible()
  await page.goto('/images-hosting/#/settings')
  await expect(page.locator('.settings-section')).toHaveCount(3)
  if (process.env.PICX_CAPTURE_TASK === 'T047') {
    await page.screenshot({ path: 'docs/UI/evidence/p6/t047-updated-offline-settings.png', fullPage: true })
    await writeFile('docs/UI/evidence/p6/t047-update.json', JSON.stringify({ before: before.length, after: after.length, removed: removed.length, added: added.length, activated: true, controllerChanged: true, offlineAfterUpdate: true }, null, 2))
  }
  await page.context().setOffline(false)
})
