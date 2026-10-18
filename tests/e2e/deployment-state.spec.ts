import process from 'node:process'
import { expect, test } from './fixtures'

for (const scenario of ['waiting', 'available', 'forbidden'] as const) {
  test(`部署状态 ${scenario} 依赖构建证据且不切换来源`, async ({ page, picx }, info) => {
    await page.route('**/git/ref/heads/gh-pages*', route => route.fulfill({ json: { object: { sha: 'fixture-current-commit' } } }))
    await page.route('https://api.github.com/repos/**/pages**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (scenario === 'forbidden')
        return route.fulfill({ status: 403, json: { message: 'Fixture forbidden' } })
      if (path.endsWith('/builds/latest'))
        return route.fulfill({ json: { status: 'built', commit: scenario === 'available' ? 'fixture-current-commit' : 'fixture-old-commit' } })
      return route.fulfill({ json: { status: 'built', html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } })
    })
    // 历史成功标记不能替代当前构建查询。
    await page.route('**/contents/.deploy*', route => route.fulfill({ json: { content: btoa(JSON.stringify({ github: { status: true, latestTime: 1 } })) } }))
    await picx.open('/settings', { savedRepository: true })
    const deploy = page.locator('.deploy-item')
    await expect(deploy).toContainText(scenario === 'available' ? '已可用' : scenario === 'waiting' ? '等待生效' : '检查或部署失败')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').imageLinkType.selected)).toBe('Fixture CDN')
    await expect(deploy.getByRole('link', { name: '访问站点' })).toHaveCount(scenario === 'available' ? 1 : 0)
    if (process.env.PICX_CAPTURE_TASK === 'T038' && info.project.name === 'desktop-chrome') {
      await page.setViewportSize({ width: 375, height: 812 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await deploy.screenshot({ path: `docs/UI/evidence/p5/t038-${scenario}-375.png` })
    }
  })
}
