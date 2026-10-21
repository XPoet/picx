import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { createDirectoryContentsFixture, fixtureRepository } from '../fixtures/ui-redesign'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
export async function mockUploadRequests(page: Page, options: { failBlob?: number, refFailure?: 'before' | 'after', forbidden?: boolean } = {}) {
  const prefix = `/repos/${fixtureRepository.owner}/${fixtureRepository.repo}`
  const blobs = new Map<string, Buffer>()
  const uploadedBytes = new Map<string, Buffer>()
  const files = new Map<string, { name: string, path: string, sha: string, size: number }>()
  let tree: { path: string, sha: string }[] = []
  let commit = 0
  const state = { bytes: uploadedBytes, calls: { blob: 0, tree: 0, commit: 0, ref: 0, contents: 0, recovered: 0 }, files, forbidden: Boolean(options.forbidden), refFailure: options.refFailure, holdRef: false, releaseRef: null as (() => void) | null }
  const shaFor = (bytes: Buffer) => createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex')
  await page.route(url => url.origin === 'https://api.github.com' && url.pathname.startsWith(prefix), async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    if (method === 'GET' && url.pathname === `${prefix}/branches/${fixtureRepository.branch}`) {
      await route.fulfill({ json: { name: fixtureRepository.branch, commit: { sha: `fixture-head-${commit}`, commit: { tree: { sha: 'fixture-root-tree' } } } } })
      return
    }
    const path = decodeURIComponent(url.pathname.slice(`${prefix}/contents/`.length))
    if (method === 'GET' && url.pathname.startsWith(`${prefix}/contents/`) && /\.(?:png|jpg|webp|mp4)$/.test(path)) {
      state.calls.recovered++
      await route.fulfill(state.forbidden ? { status: 403, json: { message: 'fixture denied' } } : files.has(path) ? { json: { ...files.get(path), type: 'file' } } : { status: 404, json: { message: 'fixture missing' } })
      return
    }
    if (method === 'GET' && url.pathname.startsWith(`${prefix}/contents/`) && path !== '.settings' && path !== '.deploy') {
      const directory = path.replace(/^\//, '').replace(/\/$/, '')
      const initial = createDirectoryContentsFixture()
      if (!Object.hasOwn(initial, directory) && ![...files.values()].some(file => file.path.startsWith(`${directory}/`))) {
        await route.fallback()
        return
      }
      const existing = initial[directory] ?? []
      const additions = [...files.values()].filter(file => file.path.slice(0, file.path.lastIndexOf('/') + 1).replace(/\/$/, '') === directory).map(file => ({ ...file, type: 'file' }))
      await route.fulfill({ json: [...existing, ...additions] })
      return
    }
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      await route.fallback()
      return
    }
    const data: unknown = request.postDataJSON()
    if (!isRecord(data)) {
      await route.fallback()
      return
    }
    if (method === 'POST' && url.pathname === `${prefix}/git/blobs` && data.encoding === 'base64' && typeof data.content === 'string') {
      state.calls.blob++
      if (state.forbidden || state.calls.blob === options.failBlob) {
        await route.fulfill({ status: state.forbidden ? 403 : 503, json: { message: 'fixture failure' } })
        return
      }
      const bytes = Buffer.from(data.content, 'base64')
      const sha = shaFor(bytes)
      blobs.set(sha, bytes)
      await route.fulfill({ status: 201, json: { sha } })
      return
    }
    if (method === 'POST' && url.pathname === `${prefix}/git/trees` && Array.isArray(data.tree)) {
      const entries: { path: string, sha: string }[] = []
      for (const entry of data.tree) {
        if (!isRecord(entry) || typeof entry.path !== 'string' || typeof entry.sha !== 'string' || !blobs.has(entry.sha)) {
          await route.abort('blockedbyclient')
          return
        }
        entries.push({ path: entry.path, sha: entry.sha })
      }
      tree = entries
      state.calls.tree++
      await route.fulfill({ status: 201, json: { sha: 'fixture-tree' } })
      return
    }
    if (method === 'POST' && url.pathname === `${prefix}/git/commits` && data.tree === 'fixture-tree') {
      state.calls.commit++
      commit++
      await route.fulfill({ status: 201, json: { sha: `fixture-commit-${commit}` } })
      return
    }
    if (method === 'PATCH' && url.pathname === `${prefix}/git/refs/heads/${fixtureRepository.branch}` && data.sha === `fixture-commit-${commit}` && data.force === false) {
      state.calls.ref++
      if (state.holdRef)
        await new Promise<void>(resolve => state.releaseRef = resolve)
      if (state.refFailure !== 'before') {
        for (const entry of tree) {
          files.set(entry.path, { name: entry.path.split('/').at(-1) ?? entry.path, path: entry.path, sha: entry.sha, size: blobs.get(entry.sha)?.length ?? 0 })
        }
      }
      await route.fulfill(state.refFailure ? { status: 503, json: { message: 'fixture ref uncertain' } } : { json: { object: { sha: data.sha } } })
      return
    }
    if (method === 'PUT' && url.pathname === `${prefix}/contents/.settings` && (data.branch === fixtureRepository.branch || (data.branch === undefined && data.sha === 'fixture-settings-sha')) && typeof data.content === 'string') {
      const settings: unknown = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
      if (!isRecord(settings) || 'token' in settings || 'authorization' in settings) {
        await route.abort('blockedbyclient')
        return
      }
      await route.fulfill({ status: 201, json: { content: { sha: 'fixture-settings-sha' } } })
      return
    }
    if (method === 'PUT' && url.pathname.startsWith(`${prefix}/contents/`) && /\.(?:png|jpg|webp|mp4)$/.test(path) && data.branch === fixtureRepository.branch && typeof data.content === 'string') {
      state.calls.contents++
      if (state.forbidden) {
        await route.fulfill({ status: 403, json: { message: 'fixture denied' } })
        return
      }
      const bytes = Buffer.from(data.content, 'base64')
      const file = { name: path.split('/').at(-1) ?? path, path, sha: shaFor(bytes), size: bytes.length }
      files.set(path, file)
      uploadedBytes.set(path, bytes)
      commit++
      await route.fulfill({ status: 201, json: { content: file, commit: { sha: `fixture-commit-${commit}` } } })
      return
    }
    await route.fallback()
  })
  return state
}
export async function mockClipboard(page: Page, rejectFirst = false) {
  await page.addInitScript((reject) => {
    let rejected = false
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => {
      if (reject && !rejected) {
        rejected = true
        throw new DOMException('fixture clipboard denied', 'NotAllowedError')
      }
      document.documentElement.dataset.copied = text
    } } })
  }, rejectFirst)
}
