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
    const contentPrefix = `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}/contents/`

    await page.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const method = request.method()

      if (url.origin === origin && (method === 'GET' || method === 'HEAD')) {
        await route.continue()
        return
      }

      if (url.origin === 'https://api.github.com' && method === 'GET' && url.pathname.startsWith(contentPrefix)) {
        const requestedPath = decodeURIComponent(url.pathname.slice(contentPrefix.length))
        // 现有目录 API 将根目录 / 拼成 contents//，兼容这一明确的根路径。
        const path = requestedPath === '/' ? '' : requestedPath
        if (path === '.settings') {
          await route.fulfill({ json: createCloudSettingsFixture() })
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
        contents = createDirectoryContentsFixture(options.directoryScenario)
        await page.addInitScript(({ config, settings }) => {
          sessionStorage.setItem('PICX_IH_GLOBAL_SETTINGS', JSON.stringify({
            language: 'zh-CN',
            languageToggleTip: false,
            theme: 'light',
            showAnnouncement: false,
          }))
          localStorage.setItem('PICX_IH_SETTINGS', JSON.stringify(settings))
          if (config) {
            localStorage.setItem('PICX_IH_CONFIG', JSON.stringify(config))
          }
        }, {
          config: options.savedRepository ? createRepositoryFixture() : null,
          settings: createSettingsFixture(),
        })
        await page.goto(`/images-hosting/#${path}`)
      },
    })

    expect(unexpectedRequests, 'Smoke must not access unlisted endpoints or perform remote writes').toEqual([])
  },
})

export { expect } from '@playwright/test'
