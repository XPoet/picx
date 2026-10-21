import process from 'node:process'
import { expect, test } from './fixtures'

for (const scenario of ['not-deployed', 'waiting', 'available', 'missing-time', 'forbidden'] as const) {
  test(`部署状态 ${scenario} 依赖构建证据且不切换来源`, async ({ page, picx }, info) => {
    let checks = 0
    await page.route('**/git/ref/heads/gh-pages*', (route) => {
      checks += 1
      return route.fulfill(scenario === 'not-deployed' ? { status: 404, json: { message: 'Not Found' } } : { json: { object: { sha: 'fixture-current-commit' } } })
    })
    await page.route('https://api.github.com/repos/**/pages**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (scenario === 'forbidden')
        return route.fulfill({ status: 403, json: { message: 'Fixture forbidden' } })
      if (path.endsWith('/builds/latest'))
        return route.fulfill({ json: { status: 'built', commit: scenario === 'waiting' ? 'fixture-old-commit' : 'fixture-current-commit', ...(scenario === 'missing-time' ? {} : { updated_at: '2026-10-20T08:30:00Z' }) } })
      return route.fulfill({ json: { status: 'built', html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } })
    })
    // 历史成功标记不能替代当前构建查询。
    await page.route('**/contents/.deploy*', route => route.fulfill({ json: { content: btoa(JSON.stringify({ github: { status: true, latestTime: 1 } })) } }))
    await picx.open('/settings', { savedRepository: true })
    const deploy = page.locator('.deploy-item')
    const isDeployed = scenario === 'available' || scenario === 'missing-time'
    await expect(page.getByRole('heading', { name: 'GitHub Pages 部署与自定义域名', exact: true })).toBeVisible()
    await expect(deploy.locator('.el-tag')).toHaveText(isDeployed ? '已部署' : scenario === 'waiting' ? '等待生效' : scenario === 'not-deployed' ? '未部署' : '检查或部署失败')
    await expect.poll(() => checks).toBe(1)
    await expect(deploy.getByRole('button', { name: '检查状态', exact: true })).toHaveCount(0)
    await expect(deploy.getByRole('button', { name: '使用 GitHub Pages 链接', exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').imageLinkType.selected)).toBe('Fixture CDN')
    if (scenario === 'available') {
      await expect(deploy.locator('time')).toHaveAttribute('datetime', '2026-10-20T08:30:00Z')
      await expect(deploy.locator('.deployment-time')).toContainText('上次部署时间：')
      await page.evaluate(() => window.location.hash = '/upload')
      await expect(page).toHaveURL(/#\/upload$/)
      await expect(deploy).toHaveCount(0)
      await page.evaluate(() => window.location.hash = '/settings')
      await expect.poll(() => checks).toBe(2)
      await expect(deploy.locator('time')).toHaveAttribute('datetime', '2026-10-20T08:30:00Z')
      await expect(deploy.getByRole('button', { name: /重新部署/ })).toBeEnabled()
      if (info.project.name === 'desktop-chrome') {
        for (const width of [1440, 375]) {
          await page.setViewportSize({ width, height: 900 })
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          await page.locator('.deployment-settings').screenshot({ path: info.outputPath(`deployment-${width}.png`) })
        }
        await page.locator('html').evaluate((element) => {
          element.classList.remove('light')
          element.classList.add('dark')
        })
        await page.locator('.deployment-settings').screenshot({ path: info.outputPath('deployment-375-dark.png') })
      }
    }
    else if (scenario === 'missing-time') {
      await expect(deploy.locator('.deployment-time')).toContainText('暂无时间记录')
      await expect(deploy.locator('time')).toHaveCount(0)
    }
    else {
      await expect(deploy.locator('.deployment-time')).toHaveCount(0)
    }
    if (process.env.PICX_CAPTURE_TASK === 'T038' && info.project.name === 'desktop-chrome') {
      await page.setViewportSize({ width: 375, height: 812 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await deploy.screenshot({ path: `docs/UI/evidence/p5/t038-${scenario}-375.png` })
    }
  })
}

test('自动检查失败后重新进入设置会重试，检查期间禁用部署且不提交写入', async ({ page, picx }) => {
  let checks = 0
  let unavailable = true
  let release: () => void = () => {}
  const responseGate = new Promise<void>((resolve) => {
    release = resolve
  })
  const writes: string[] = []
  await page.route('https://api.github.com/repos/**/pages**', async (route) => {
    if (route.request().method() !== 'GET')
      writes.push(route.request().method())
    if (unavailable)
      return route.fulfill({ status: 403, json: { message: 'Forbidden' } })
    if (new URL(route.request().url()).pathname.endsWith('/builds/latest'))
      return route.fulfill({ json: { status: 'built', commit: 'fixture-old-commit' } })
    await responseGate
    return route.fulfill({ json: { status: 'built', html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } })
  })
  await page.route('**/git/ref/heads/gh-pages*', (route) => {
    checks += 1
    return route.fulfill({ json: { object: { sha: 'fixture-current-commit' } } })
  })
  await picx.open('/settings', { savedRepository: true })
  await expect(page.locator('.deploy-item .el-tag')).toHaveText('检查或部署失败')
  unavailable = false
  await page.evaluate(() => window.location.hash = '/upload')
  await expect(page.locator('.deploy-item')).toHaveCount(0)
  await page.evaluate(() => window.location.hash = '/settings')
  await expect(page.locator('.deploy-item .el-tag')).toHaveText('检查中')
  await expect(page.locator('.deploy-item .el-button')).toBeDisabled()
  await expect.poll(() => checks).toBe(2)
  release()
  await expect(page.locator('.deploy-item .el-tag')).toHaveText('等待生效')
  expect(writes).toEqual([])
})
