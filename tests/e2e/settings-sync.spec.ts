import process from 'node:process'
import { createCloudSettingsFixture, createSettingsFixture } from '../fixtures/ui-redesign'
import { expect, test } from './fixtures'

for (const scenario of ['forbidden', 'corrupt'] as const) {
  test(`云端 ${scenario} 不覆盖，本地保留并可显式重试`, async ({ page, picx }, info) => {
    let failed = true
    let writes = 0
    let file = createCloudSettingsFixture(createSettingsFixture())
    await page.route('**/contents/.settings*', async (route) => {
      if (route.request().method() === 'GET') {
        if (failed)
          await route.fulfill(scenario === 'forbidden' ? { status: 403, json: { message: 'Fixture forbidden' } } : { json: { sha: 'fixture-corrupt', content: '%%%' } })
        else await route.fulfill({ json: file })
        return
      }
      if (route.request().method() === 'PUT') {
        const data: unknown = route.request().postDataJSON()
        if (!data || typeof data !== 'object' || !('content' in data) || typeof data.content !== 'string')
          throw new Error('Expected simulated preference content')
        file = { sha: 'fixture-updated', content: data.content }
        writes += 1
        await route.fulfill({ json: { content: { sha: file.sha } } })
        return
      }
      await route.abort()
    })
    await picx.open('/settings', { savedRepository: true })
    const feedback = page.locator('.settings-sync-feedback')
    await expect(feedback).toContainText('云端同步失败')
    await page.getByRole('switch', { name: '是否压缩图片', exact: true }).press('Space')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').compress.enable)).toBe(true)
    await expect(feedback).toContainText('云端同步失败')
    expect(writes).toBe(0)
    if (process.env.PICX_CAPTURE_TASK === 'T037' && info.project.name === 'desktop-chrome') {
      await page.setViewportSize({ width: 375, height: 812 })
      await feedback.screenshot({ path: `docs/UI/evidence/p5/t037-${scenario}-375.png` })
    }
    failed = false
    await feedback.getByRole('button', { name: '重试同步', exact: true }).click()
    await expect.poll(() => writes).toBe(1)
    await expect(feedback).toBeHidden()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('PICX_IH_SETTINGS') ?? '{}').compress.enable)).toBe(true)
  })
}
