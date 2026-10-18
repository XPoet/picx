import process from 'node:process'
import { createCloudSettingsFixture, createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'
import { expect, openNavigation, test } from './fixtures'

test('两处共享部署、确认取消、防重与 D 快捷键，成功后显式选择来源', async ({ page, picx }, info) => {
  let sha = 'fixture-old'
  let deletes = 0
  let creates = 0
  let waitingBuild = false
  let hold = true
  let release: () => void = () => {}
  const settings = createSettingsFixture()
  settings.deploy.customDomain = 'images.example.test'
  await page.route('https://api.github.com/repos/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    const base = `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}`
    if (path === `${base}/contents/.settings` && method === 'GET') {
      await route.fulfill({ json: createCloudSettingsFixture(settings) })
      return
    }
    if (path === `${base}/git/ref/heads/gh-pages` && method === 'GET') {
      await route.fulfill(sha ? { json: { object: { sha } } } : { status: 404, json: { message: 'Fixture missing' } })
      return
    }
    if (path === `${base}/git/ref/heads/${fixtureRepository.branch}` && method === 'GET') {
      await route.fulfill({ json: { object: { sha: 'fixture-new' } } })
      return
    }
    if (path === `${base}/git/refs/heads/gh-pages` && method === 'DELETE') {
      deletes += 1
      sha = ''
      await route.fulfill({ status: 204 })
      return
    }
    if (path === `${base}/git/refs` && method === 'POST') {
      creates += 1
      sha = 'fixture-new'
      await route.fulfill({ status: 201, json: { object: { sha } } })
      return
    }
    if (path === `${base}/contents/CNAME` && method === 'GET') {
      await route.fulfill({ json: { sha: 'fixture-cname', content: btoa('images.example.test') } })
      return
    }
    if (path === `${base}/pages` && method === 'GET') {
      await route.fulfill({ json: { status: 'built', html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } })
      return
    }
    if (path === `${base}/pages/builds/latest` && method === 'GET') {
      if (sha === 'fixture-new' && hold) {
        waitingBuild = true
        await new Promise<void>((resolve) => {
          release = resolve
        })
      }
      await route.fulfill({ json: { status: 'built', commit: sha } })
      return
    }
    await route.fallback()
  })
  await picx.open('/settings', { savedRepository: true, settingsWritable: true })
  const deployment = page.locator('.deploy-item')
  await expect(deployment).toContainText('已可用')
  await deployment.getByRole('button', { name: /重新部署/ }).click()
  await expect(page.getByRole('dialog', { name: '提示', exact: true })).toContainText('替换已有 Pages 内容')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.locator('.el-message-box')).toBeHidden()
  expect(deletes).toBe(0)
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+d')
  await page.getByRole('button', { name: '确定', exact: true }).click()
  await expect.poll(() => waitingBuild).toBe(true)
  await expect(deployment).toContainText('等待生效')
  await expect(deployment.getByRole('button', { name: /一键部署/ })).toBeDisabled()
  if (process.env.PICX_CAPTURE_TASK === 'T039' && info.project.name === 'desktop-chrome')
    await deployment.screenshot({ path: 'docs/UI/evidence/p5/t039-settings-waiting.png' })
  await openNavigation(page)
  await page.getByRole('link', { name: '上传图片', exact: true }).click()
  await expect(deployment).toContainText('等待生效')
  await expect(deployment.getByRole('button', { name: /一键部署/ })).toBeDisabled()
  expect(deletes).toBe(1)
  expect(creates).toBe(1)
  hold = false
  release()
  await expect(deployment).toContainText('已可用')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').imageLinkType.selected)).toBe('Fixture CDN')
  await deployment.getByRole('button', { name: '使用 GitHub Pages 链接', exact: true }).click()
  await expect(deployment).toContainText('当前链接来源：GitHub Pages')
  if (process.env.PICX_CAPTURE_TASK === 'T039' && info.project.name === 'desktop-chrome') {
    await page.setViewportSize({ width: 375, height: 812 })
    await deployment.screenshot({ path: 'docs/UI/evidence/p5/t039-upload-available-375.png' })
  }
})
