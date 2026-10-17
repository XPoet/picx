import { createDirectoryContentsFixture, createRepositoryFixture } from '../fixtures/ui-redesign'
import { test as base, expect } from './fixtures'

export const test = base.extend<{
  management: { open: (options?: { scenario?: 'folders' | 'mixed' | 'empty', media?: boolean, language?: 'zh-CN' | 'zh-TW' | 'en', theme?: 'light' | 'dark' }) => Promise<void>, requests: string[] }
}>({
  management: async ({ page, picx }, use) => {
    const requests: string[] = []
    let contents = createDirectoryContentsFixture()
    const prefix = `/repos/${createRepositoryFixture().owner}/${createRepositoryFixture().repo}/contents/`
    await page.route('https://api.github.com/**', async (route) => {
      const url = new URL(route.request().url())
      const path = decodeURIComponent(url.pathname.slice(prefix.length))
      if (route.request().method() === 'GET' && url.pathname.startsWith(prefix) && Object.hasOwn(contents, path)) {
        requests.push(path)
        await route.fulfill({ json: contents[path] })
        return
      }
      await route.fallback()
    })
    await page.route('https://images.example.test/**', async (route) => {
      if (route.request().url().endsWith('.mp4'))
        await route.fulfill({ contentType: 'video/mp4', body: '' })
      else await route.fallback()
    })
    await use({
      requests,
      open: async (options = {}) => {
        contents = createDirectoryContentsFixture(options.scenario)
        if (options.media) {
          contents[''].push(...['a-very-long-photo-name-that-can-be-opened-in-properties.png', 'broken.png', 'unknown.png'].map((name, index) => ({ type: 'file' as const, name, path: name, sha: `fixture-extra-${index}`, size: index === 2 ? 0 : 8192 })))
        }
        contents.albums = [{ type: 'dir', name: '旅行照片与很长的文件夹名称', path: 'albums/旅行照片与很长的文件夹名称', sha: 'nested-sha', size: 0 }, ...contents.albums]
        contents['albums/旅行照片与很长的文件夹名称'] = [{ type: 'file', name: 'mountain.png', path: 'albums/旅行照片与很长的文件夹名称/mountain.png', sha: 'mountain-sha', size: 3072 }]
        await picx.open('/management', { savedRepository: true, language: options.language, theme: options.theme, directoryScenario: options.scenario })
        await expect(page.locator('.management-page-container')).toBeVisible()
      },
    })
  },
})

export { expect }
