import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router'

const returnPaths = ['/upload', '/management', '/settings']
const callbackKeys = ['code', 'state', 'error', 'error_description', 'error_uri', 'setup_action', 'installation_id', 'token', 'access_token']

export function connectionReturnTo(value: unknown): string {
  if (value === '/config')
    return '/upload'
  return typeof value === 'string' && returnPaths.includes(value) ? value : '/upload'
}

export function connectionLocation(returnTo: unknown = '/upload', focus = false): RouteLocationRaw {
  return { path: '/', query: { jump: '0', returnTo: connectionReturnTo(returnTo), ...(focus ? { focus: '1' } : {}) } }
}

export function legacyConfigLocation(query: LocationQuery, saved: { complete: boolean, hasDirectory: boolean }): RouteLocationRaw {
  const returnTo = connectionReturnTo(query.returnTo)
  if (query.focus === '1')
    return connectionLocation(returnTo, true)
  if (saved.complete)
    return { path: '/upload', query: saved.hasDirectory ? {} : { directory: '1' } }
  return { path: '/', query: { jump: '0', returnTo, ...(query.auto === '1' ? { auto: '1' } : {}) } }
}

function hashParts(url: URL) {
  const hash = url.hash.slice(1)
  const index = hash.indexOf('?')
  return { path: index < 0 ? hash || '/' : hash.slice(0, index), params: new URLSearchParams(index < 0 ? '' : hash.slice(index + 1)) }
}

export type AuthorizationCallback
  = | { kind: 'code', code: string, returnTo: string }
    | { kind: 'installation', installationId: string, returnTo: string }
    | { kind: 'cancelled', returnTo: string }

export function readAuthorizationCallback(url: URL): AuthorizationCallback | null {
  const { params } = hashParts(url)
  const get = (key: string) => url.searchParams.get(key) || params.get(key)
  const returnTo = connectionReturnTo(get('returnTo') || get('state'))
  if (get('error'))
    return { kind: 'cancelled', returnTo }
  const code = get('code')
  if (code)
    return { kind: 'code', code, returnTo }
  const installationId = get('installation_id')
  if (['install', 'update'].includes(get('setup_action') ?? '') && installationId && /^\d+$/.test(installationId)) {
    return { kind: 'installation', installationId, returnTo }
  }
  if (callbackKeys.some(key => url.searchParams.has(key) || params.has(key)))
    return { kind: 'cancelled', returnTo }
  return null
}

export function cleanAuthorizationURL(url: URL): string {
  const clean = new URL(url)
  const { path, params } = hashParts(clean)
  for (const key of callbackKeys) {
    clean.searchParams.delete(key)
    params.delete(key)
  }
  clean.hash = `${path}${params.size ? `?${params.toString()}` : ''}`
  return `${clean.pathname}${clean.search}${clean.hash}`
}

export function cleanConnectionQuery(query: LocationQuery): LocationQueryRaw {
  return { jump: '0', returnTo: connectionReturnTo(query.returnTo) }
}
