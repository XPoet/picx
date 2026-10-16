import type { Page } from '@playwright/test'
import type { DirectoryScenario } from '../fixtures/ui-redesign'
import { Buffer } from 'node:buffer'
import { test as base, expect } from '@playwright/test'
import {
  createCloudSettingsFixture,
  createDirectoryContentsFixture,
  createFailureFixture,
  createRepositoryFixture,
  createSettingsFixture,
  fixturePngBase64,
  fixtureRepository,
} from '../fixtures/ui-redesign'

interface OpenPageOptions {
  savedRepository?: boolean
  directoryScenario?: DirectoryScenario
  language?: 'zh-CN' | 'zh-TW' | 'en'
  theme?: 'light' | 'dark' | 'system'
  processingDisabled?: boolean
  connectionScenario?: 'ready' | 'app-missing'
  savedOAuth?: boolean
}

interface PicxFixture {
  open: (path: string, options?: OpenPageOptions) => Promise<void>
}

export const test = base.extend<{ picx: PicxFixture }>({
  serviceWorkers: 'block',
  picx: async ({ page, baseURL }, use) => {
    if (!baseURL) {
      throw new Error('Smoke requires the configured preview baseURL')
    }

    const origin = new URL(baseURL).origin
    const unexpectedRequests: string[] = []
    let contents = createDirectoryContentsFixture()
    let settings = createSettingsFixture()
    let connectionScenario: OpenPageOptions['connectionScenario']
    const contentPrefix = `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}/contents/`

    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const method = request.method()

      if (url.origin === origin && (method === 'GET' || method === 'HEAD')) {
        await route.continue()
        return
      }

      // 登出后默认语言引导会查询地区；返回文档保留地址，绝不访问真实 IP 服务。
      if (method === 'GET' && url.origin === 'https://api.ipify.org' && url.pathname === '/') {
        await route.fulfill({ json: { ip: '203.0.113.1' } })
        return
      }
      if (method === 'GET' && url.origin === 'https://ipapi.co' && url.pathname === '/203.0.113.1/country/') {
        await route.fulfill({ contentType: 'text/plain', body: 'CN' })
        return
      }

      if (connectionScenario && url.origin === 'https://api.github.com' && method === 'GET') {
        if (url.pathname === '/user') {
          await route.fulfill({ json: { id: 42, login: fixtureRepository.owner, name: 'Fixture User', email: null, avatar_url: '' } })
          return
        }
        if (url.pathname === '/user/installations') {
          await route.fulfill({ json: { installations: connectionScenario === 'app-missing' ? [] : [{ id: 7 }] } })
          return
        }
        if (url.pathname === `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}`) {
          await route.fulfill({ json: { name: fixtureRepository.repo, private: false, default_branch: fixtureRepository.branch, owner: { login: fixtureRepository.owner }, permissions: { push: true } } })
          return
        }
        if (url.pathname === `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}/branches/${fixtureRepository.branch}`) {
          await route.fulfill({ json: { name: fixtureRepository.branch } })
          return
        }
      }

      if (url.origin === 'https://api.github.com' && method === 'GET' && url.pathname.startsWith(contentPrefix)) {
        const requestedPath = decodeURIComponent(url.pathname.slice(contentPrefix.length))
        // 现有目录 API 将根目录 / 拼成 contents//，兼容这一明确的根路径。
        const path = requestedPath === '/' ? '' : requestedPath
        if (path === '.settings') {
          await route.fulfill({ json: createCloudSettingsFixture(settings) })
          return
        }
        if (path === '.deploy') {
          await route.fulfill(createFailureFixture('not-found'))
          return
        }
        if (Object.hasOwn(contents, path)) {
          await route.fulfill({ json: contents[path] })
          return
        }
      }

      if (method === 'GET' && url.origin === 'https://images.example.test' && url.pathname.endsWith('.png')) {
        await route.fulfill({ contentType: 'image/png', body: Buffer.from(fixturePngBase64, 'base64') })
        return
      }

      // 只记录方法与无 query 的路径，不记录请求头、正文或凭据。
      unexpectedRequests.push(`${method} ${url.origin}${url.pathname}`)
      await route.abort('blockedbyclient')
    })

    await use({
      open: async (path, options = {}) => {
        connectionScenario = options.connectionScenario
        contents = createDirectoryContentsFixture(options.directoryScenario)
        settings = createSettingsFixture()
        if (options.processingDisabled) {
          settings.compress.enable = false
          settings.watermark.enable = false
        }
        await page.evaluate(() => {
          window.name = ''
        })
        await page.addInitScript(({ config, settings, language, theme, savedOAuth }) => {
          // 重载必须保留应用实际写入 / 登出结果，不能重新注入登录态。
          if (window.name === 'picx-ui-fixture-seeded') {
            return
          }
          window.name = 'picx-ui-fixture-seeded'
          sessionStorage.setItem('PICX_IH_GLOBAL_SETTINGS', JSON.stringify({
            language,
            languageToggleTip: false,
            theme,
            showAnnouncement: false,
          }))
          localStorage.setItem('PICX_IH_SETTINGS', JSON.stringify(settings))
          if (savedOAuth) {
            localStorage.setItem('PICX_IH_AUTHORIZATION', JSON.stringify({ token: 'fixture-invalid-credential', tokenCreateTime: Date.now(), authorized: true, installed: null, isAutoAuthorize: true }))
          }
          if (config) {
            localStorage.setItem('PICX_IH_CONFIG', JSON.stringify(config))
          }
        }, {
          config: options.savedRepository ? createRepositoryFixture() : null,
          settings,
          language: options.language ?? 'zh-CN',
          theme: options.theme ?? 'light',
          savedOAuth: Boolean(options.savedOAuth),
        })
        await page.goto(`/images-hosting/#${path}`)
      },
    })

    expect(unexpectedRequests, 'Smoke must not access unlisted endpoints or perform remote writes').toEqual([])
  },
})

export { expect } from '@playwright/test'

export async function openNavigation(page: Page) {
  await expect(page.getByRole('main')).toBeVisible()
  const toggle = page.locator('button[aria-controls="picx-primary-navigation"]')
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') {
    await toggle.click()
  }
}
