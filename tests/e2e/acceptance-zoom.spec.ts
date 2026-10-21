import { Buffer } from 'node:buffer'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { chromium, expect, test } from '@playwright/test'
import { createRepositoryFixture, createSettingsFixture } from '../fixtures/ui-redesign'

test.use({ viewport: null, deviceScaleFactor: undefined })

test('T042 原生 Chrome 200% 页面缩放保持表单、重排与底部操作', async ({ baseURL }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', '原生桌面窗口缩放单独验证，手机模拟不重复执行')
  if (!baseURL)
    throw new Error('Preview URL required')
  const dimensions: { width: number, scale: number }[] = []
  for (const zoom of [1, 2]) {
    const profile = await mkdtemp(join(tmpdir(), 'picx-p6-zoom-'))
    await mkdir(join(profile, 'Default'))
    // Chromium kPartitionDefaultZoomLevel；只写新建的测试配置，不读取用户浏览器数据。
    await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } } }))
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      viewport: null,
      deviceScaleFactor: undefined,
      serviceWorkers: 'block',
      args: ['--window-size=1440,1080', '--force-device-scale-factor=1'],
    })
    try {
      await context.route('**/*', route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort('blockedbyclient'))
      await context.addInitScript(({ config, settings }) => {
        sessionStorage.setItem('PICX_IH_GLOBAL_SETTINGS', JSON.stringify({ language: 'en', languageToggleTip: false, theme: 'light', showAnnouncement: false }))
        localStorage.setItem('PICX_IH_CONFIG', JSON.stringify(config))
        localStorage.setItem('PICX_IH_SETTINGS', JSON.stringify(settings))
      }, { config: createRepositoryFixture(), settings: createSettingsFixture() })
      const page = await context.newPage()
      await page.goto(`${baseURL}/images-hosting/#/?jump=0`)
      await expect(page.getByLabel('GitHub Token', { exact: true })).toBeVisible()
      dimensions.push(await page.evaluate(() => ({ width: innerWidth, scale: devicePixelRatio })))
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.goto(`${baseURL}/images-hosting/#/settings`)
      const save = page.getByRole('button', { name: 'Save and deploy', exact: true })
      await save.scrollIntoViewIfNeeded()
      await expect(save).toBeInViewport()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.PICX_CAPTURE_TASK === 'T042') {
        const session = await context.newCDPSession(page)
        const screenshot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
        await writeFile(`docs/UI/evidence/p6/t042-native-zoom-${zoom * 100}.png`, Buffer.from(screenshot.data, 'base64'))
      }
    }
    finally {
      await context.close()
    }
  }
  expect(dimensions[1].scale / dimensions[0].scale).toBeCloseTo(2)
  expect(Math.abs(dimensions[0].width - dimensions[1].width * 2)).toBeLessThanOrEqual(2)
  if (process.env.PICX_CAPTURE_TASK === 'T042')
    await writeFile('docs/UI/evidence/p6/t042-native-zoom.json', JSON.stringify(dimensions, null, 2))
  await info.attach('native-zoom-dimensions', { body: JSON.stringify(dimensions), contentType: 'application/json' })
})
