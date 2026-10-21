import { describe, expect, it } from 'vitest'
import { cleanAuthorizationURL, connectionReturnTo, legacyConfigLocation, readAuthorizationCallback } from '@/utils/login-navigation'

describe('连接入口与安全返回目标', () => {
  it.each(['/upload', '/management', '/settings'])('白名单站内目标 %s 保留', (path) => {
    expect(connectionReturnTo(path)).toBe(path)
  })
  it.each(['https://example.test', '//example.test', '/upload?token=fixture', '/unknown', ['settings'], null])('其他返回目标回退上传页', (path) => {
    expect(connectionReturnTo(path)).toBe('/upload')
  })
  it('旧配置与 focus / auto 依据实际配置动态进入流程', () => {
    expect(connectionReturnTo('/config')).toBe('/upload')
    expect(legacyConfigLocation({}, { complete: true, hasDirectory: true })).toEqual({ path: '/upload', query: {} })
    expect(legacyConfigLocation({}, { complete: true, hasDirectory: false })).toEqual({ path: '/upload', query: { directory: '1' } })
    expect(legacyConfigLocation({ focus: '1' }, { complete: true, hasDirectory: true })).toEqual({ path: '/', query: { jump: '0', returnTo: '/upload', focus: '1' } })
    expect(legacyConfigLocation({ auto: '1' }, { complete: false, hasDirectory: false })).toEqual({ path: '/', query: { jump: '0', returnTo: '/upload', auto: '1' } })
  })

  it('外层与 Hash 回调参数全部清理，合法业务 query 保留', () => {
    const source = new URL('https://example.test/images-hosting/?code=fixture-outer&state=/settings&keep=yes#/login?code=fixture-hash&error_description=unsafe&installation_id=7&token=fixture&focus=1')
    expect(readAuthorizationCallback(source)).toEqual({ kind: 'code', code: 'fixture-outer', returnTo: '/settings' })
    const clean = cleanAuthorizationURL(source)
    expect(clean).toBe('/images-hosting/?keep=yes#/login?focus=1')
    expect(source.searchParams.get('code')).toBe('fixture-outer')
  })

  it('hash code、安装与取消可区分，不使用远端错误原文', () => {
    expect(readAuthorizationCallback(new URL('https://example.test/#/config?code=fixture&returnTo=/management'))).toMatchObject({ kind: 'code', returnTo: '/management' })
    expect(readAuthorizationCallback(new URL('https://example.test/?setup_action=install&installation_id=7#/'))).toEqual({ kind: 'installation', installationId: '7', returnTo: '/upload' })
    expect(readAuthorizationCallback(new URL('https://example.test/?error=remote-private-message&state=https://unsafe.test#/'))).toEqual({ kind: 'cancelled', returnTo: '/upload' })
    expect(readAuthorizationCallback(new URL('https://example.test/#/?code='))).toEqual({ kind: 'cancelled', returnTo: '/upload' })
    expect(readAuthorizationCallback(new URL('https://example.test/#/upload'))).toBeNull()
  })
})
