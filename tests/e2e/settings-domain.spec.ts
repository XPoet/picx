import type { Page } from '@playwright/test'
import process from 'node:process'
import { createCloudSettingsFixture, createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'

type Scenario = 'create' | 'update' | 'consistent' | 'cname-failure' | 'deploy-failure' | 'clear'
async function domainFixture(page: Page, scenario: Scenario) {
  let domain = ['update', 'clear'].includes(scenario) ? 'old.example.test' : scenario === 'consistent' ? 'images.example.test' : ''
  let ghSha = ''
  let pages = ['update', 'consistent'].includes(scenario)
  let pagesDomain = domain
  const counts = { cnameWrites: 0, branchCreates: 0 }
  const settings = createSettingsFixture()
  settings.deploy.customDomain = domain
  const base = `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}`
  await page.route('https://api.github.com/repos/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (path === `${base}/contents/.settings` && method === 'GET') {
      await route.fulfill({ json: createCloudSettingsFixture(settings) })
      return
    }
    if (path === `${base}/git/ref/heads/gh-pages` && method === 'GET') {
      await route.fulfill(ghSha ? { json: { object: { sha: ghSha } } } : { status: 404, json: { message: 'Fixture missing' } })
      return
    }
    if (path === `${base}/git/ref/heads/${fixtureRepository.branch}` && method === 'GET') {
      await route.fulfill(scenario === 'deploy-failure' ? { status: 403, json: { message: 'Fixture forbidden' } } : { json: { object: { sha: 'fixture-deploy' } } })
      return
    }
    if (path === `${base}/contents/CNAME`) {
      if (method === 'GET') {
        await route.fulfill(domain ? { json: { sha: 'fixture-cname', content: btoa(domain) } } : { status: 404, json: { message: 'Fixture missing' } })
        return
      }
      if (method === 'PUT' || method === 'DELETE') {
        counts.cnameWrites += 1
        if (scenario === 'cname-failure') {
          await route.fulfill({ status: 403, json: { message: 'Fixture forbidden' } })
          return
        }
        if (method === 'PUT') {
          const data: unknown = request.postDataJSON()
          if (!data || typeof data !== 'object' || !('content' in data) || typeof data.content !== 'string')
            throw new Error('Expected simulated CNAME content')
          domain = atob(data.content)
        }
        else {
          domain = ''
        }
        await route.fulfill({ status: method === 'PUT' ? 201 : 200, json: { commit: { sha: 'fixture-cname-commit' }, content: { sha: 'fixture-cname' } } })
        return
      }
    }
    if (path === `${base}/git/refs` && method === 'POST') {
      counts.branchCreates += 1
      ghSha = 'fixture-deploy'
      await route.fulfill({ status: 201, json: { object: { sha: ghSha } } })
      return
    }
    if (path === `${base}/pages`) {
      if (method === 'GET' && !pages) {
        await route.fulfill({ status: 404, json: { message: 'Fixture missing' } })
        return
      }
      if (method === 'POST') {
        pages = true
        pagesDomain = ''
      }
      if (method === 'PUT') {
        const data: unknown = request.postDataJSON()
        if (data && typeof data === 'object' && 'cname' in data && (data.cname === null || typeof data.cname === 'string'))
          pagesDomain = data.cname ?? ''
        await route.fulfill({ status: 204 })
        return
      }
      await route.fulfill({ json: { status: 'built', cname: pagesDomain || null, html_url: pagesDomain ? `https://${pagesDomain}/` : `https://${fixtureRepository.owner}.github.io/${fixtureRepository.repo}/`, source: { branch: 'gh-pages', path: '/' } } })
      return
    }
    if (path === `${base}/pages/builds/latest` && method === 'GET') {
      await route.fulfill({ json: { status: 'built', commit: ghSha } })
      return
    }
    await route.fallback()
  })
  return counts
}

test('域名草稿规范化与非法输入不会保存或部署', async ({ page, picx }) => {
  await picx.open('/settings', { savedRepository: true })
  await expect(page.locator('.deploy-item')).toContainText('未部署')
  const input = page.getByRole('textbox', { name: '自定义域名', exact: true })
  await input.fill('HTTPS://Images.Example.test/photos')
  await expect(page.getByTestId('domain-normalized')).toContainText('images.example.test')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').deploy.customDomain)).toBe('')
  await input.fill('/path-only')
  await page.getByRole('button', { name: '保存并部署', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('域名格式不正确')
  await input.fill('invalid host')
  await page.getByRole('button', { name: '保存并部署', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('域名格式不正确')
  await expect(input).toHaveValue('invalid host')
})

for (const scenario of ['create', 'update', 'consistent', 'cname-failure', 'deploy-failure', 'clear'] as const) {
  test(`域名 ${scenario} 步骤准确且保留来源`, async ({ page, picx }, info) => {
    const counts = await domainFixture(page, scenario)
    await picx.open('/settings', { savedRepository: true, settingsWritable: true })
    await expect(page.locator('.deploy-item')).toContainText('未部署')
    await expect(page.locator('.settings-sync-feedback')).toBeHidden()
    const input = page.getByRole('textbox', { name: '自定义域名', exact: true })
    const save = page.getByRole('button', { name: '保存并部署', exact: true })
    const feedback = page.locator('.domain-save-feedback')
    if (scenario === 'clear') {
      await input.fill('')
      await save.click()
      await expect(page.getByRole('dialog', { name: '提示', exact: true })).toContainText('old.example.test')
      await page.getByRole('button', { name: '取消', exact: true }).click()
      await expect(page.locator('.el-message-box')).toBeHidden()
      await expect(feedback).toContainText('操作已取消')
      expect(counts.cnameWrites).toBe(0)
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').deploy.customDomain)).toBe('old.example.test')
      await save.click()
      await page.getByRole('button', { name: '确定', exact: true }).click()
      await expect(page.locator('.el-message-box')).toBeHidden()
      await expect(feedback).toContainText('远端 CNAME 已移除')
      await expect(feedback).toContainText('已可用')
    }
    else {
      const draft = ' HTTPS://Images.Example.test/photos '
      await input.fill(draft)
      await save.click()
      await expect(feedback).toContainText('本地已保存：images.example.test')
      if (scenario === 'cname-failure' || scenario === 'deploy-failure') {
        await expect(feedback).toContainText(scenario === 'cname-failure' ? 'CNAME 同步失败，未提交部署' : '部署未完成')
        expect(counts.branchCreates).toBe(0)
        await expect(input).toHaveValue(draft)
      }
      else {
        await expect(feedback).toContainText('已可用')
        expect(counts.branchCreates).toBe(1)
        expect(counts.cnameWrites).toBe(scenario === 'consistent' ? 0 : 1)
      }
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').imageLinkType.selected)).toBe('Fixture CDN')
    await expect(page.getByText('指向 fixture-owner.github.io', { exact: false })).toBeVisible()
    if (process.env.PICX_CAPTURE_TASK === 'T040' && info.project.name === 'desktop-chrome') {
      if (scenario === 'update') {
        await page.setViewportSize({ width: 1440, height: 1080 })
        await page.screenshot({ path: 'docs/UI/evidence/p5/t040-settings-1440.png', fullPage: true })
      }
      await page.setViewportSize({ width: 375, height: 812 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByRole('region', { name: '部署与域名', exact: true }).screenshot({ path: `docs/UI/evidence/p5/t040-${scenario}-375.png` })
    }
  })
}

test('375px 设置页关键输入 16px，步进按钮至少 44px', async ({ page, picx }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await picx.open('/settings', { savedRepository: true })
  await expect(page.getByRole('textbox', { name: '自定义域名', exact: true })).toHaveCSS('font-size', '16px')
  await expect(page.getByRole('textbox', { name: '水印文字', exact: true })).toHaveCSS('font-size', '16px')
  const controls = await page.locator('.watermark-config-form .el-input-number__decrease, .watermark-config-form .el-input-number__increase').evaluateAll(elements => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }))
  expect(controls.length).toBeGreaterThan(0)
  expect(controls.every(control => control.width >= 44 && control.height >= 44)).toBe(true)
})

for (const variant of [{ language: 'en', title: 'Deployment and domain' }, { language: 'zh-TW', title: '部署與網域' }] as const) {
  test(`P5 设置页 ${variant.language} 暗色 375px 完整呈现`, async ({ page, picx }, info) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await picx.open('/settings', { savedRepository: true, language: variant.language, theme: 'dark' })
    await expect(page.getByRole('heading', { name: variant.title, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: variant.language === 'en' ? 'Save and deploy' : '儲存並部署', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.PICX_CAPTURE_TASK === 'T040' && info.project.name === 'desktop-chrome')
      await page.screenshot({ path: `docs/UI/evidence/p5/t040-${variant.language}-dark-375.png`, fullPage: true })
  })
}
