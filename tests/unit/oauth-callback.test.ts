import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exchangeAuthorizationCode } from '@/common/api/oauth'
import { LS_AUTHORIZATION, LS_CONFIG } from '@/common/constant'
import router from '@/router'
import { connectGitHub } from '@/services/github-connection'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { githubAppAuthorizeCallback } from '@/views/picx-login/picx-login.util'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/common/api/oauth', () => ({ exchangeAuthorizationCode: vi.fn() }))
vi.mock('@/services/github-connection', () => ({ connectGitHub: vi.fn() }))
vi.mock('@/router', () => ({ default: { replace: vi.fn(), currentRoute: { value: { path: '/', query: {} } } } }))

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  usePicxStore(pinia).$reset()
  window.history.replaceState(null, '', '/images-hosting/#/')
  vi.mocked(router.replace).mockResolvedValue()
  vi.mocked(exchangeAuthorizationCode).mockResolvedValue({ ok: true, data: 'fixture-invalid-credential' })
  vi.mocked(connectGitHub).mockResolvedValue({ ok: true, data: {
    account: { id: 42, login: 'fixture-owner', name: null, email: null, avatar_url: '' },
    repository: { owner: 'fixture-owner', repo: 'picx-images-hosting', branch: 'custom' },
    visibility: 'public',
    reuseDirectory: false,
  } })
})

describe('oAuth 回调的单次消费与收尾', () => {
  it('先清理外层与 Hash URL，再交换；重复调用只执行一次', async () => {
    window.history.replaceState(null, '', '/images-hosting/?code=fixture-outer&state=/settings#/config?code=fixture-hash')
    const first = githubAppAuthorizeCallback()
    expect(githubAppAuthorizeCallback()).toBe(first)
    expect(location.href).not.toContain('code=')
    expect(location.href).not.toContain('state=')
    expect(await first).toMatchObject({ handled: true, connected: true, returnTo: '/settings' })
    expect(exchangeAuthorizationCode).toHaveBeenCalledTimes(1)
    expect(usePicxStore(pinia).connection.phase).toBe('connected')
    const authorization = JSON.parse(localStorage.getItem(LS_AUTHORIZATION) ?? '{}')
    expect(authorization.code).toBe('')
    expect(authorization.codeCreateTime).toBe(0)
    expect((await githubAppAuthorizeCallback()).handled).toBe(false)
  })

  it('交换失败清理参数并保留原有配置，只显示脱敏错误', async () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture())
    store.USER_CONFIG_INFO_PERSIST()
    const initial = localStorage.getItem(LS_CONFIG)
    vi.mocked(exchangeAuthorizationCode).mockResolvedValueOnce({ ok: false, error: { kind: 'network', retryable: true } })
    window.history.replaceState(null, '', '/images-hosting/#/login?code=fixture&returnTo=/management')
    expect(await githubAppAuthorizeCallback()).toMatchObject({ handled: true, connected: false, returnTo: '/management' })
    expect(store.connection).toMatchObject({ phase: 'failed', error: { kind: 'network' } })
    expect(location.href).not.toContain('code=')
    expect(localStorage.getItem(LS_CONFIG)).toBe(initial)
    expect(connectGitHub).not.toHaveBeenCalled()
  })

  it('安装回调仅更新安装信息，不冒充连接；拒绝授权可恢复', async () => {
    window.history.replaceState(null, '', '/images-hosting/?setup_action=install&installation_id=7#/')
    expect(await githubAppAuthorizeCallback()).toMatchObject({ connected: false, installationReady: true })
    expect(usePicxStore(pinia).connection.phase).toBe('disconnected')
    expect(exchangeAuthorizationCode).not.toHaveBeenCalled()
    window.history.replaceState(null, '', '/images-hosting/?error=not-shown&error_description=not-shown#/')
    expect(await githubAppAuthorizeCallback()).toMatchObject({ handled: true, connected: false })
    expect(usePicxStore(pinia).connection).toMatchObject({ phase: 'failed', error: { kind: 'oauth-cancelled' } })
    expect(location.search).toBe('')
  })

  it('登出后迟到的交换结果不能验证或重新提交凭据', async () => {
    let finish: (value: Awaited<ReturnType<typeof exchangeAuthorizationCode>>) => void = () => {}
    vi.mocked(exchangeAuthorizationCode).mockImplementationOnce(() => new Promise((resolve) => {
      finish = resolve
    }))
    window.history.replaceState(null, '', '/images-hosting/?code=fixture#/')
    const pending = githubAppAuthorizeCallback()
    await vi.waitFor(() => expect(exchangeAuthorizationCode).toHaveBeenCalledTimes(1))
    usePicxStore(pinia).LOGOUT()
    finish({ ok: true, data: 'fixture-invalid-credential' })
    expect(await pending).toMatchObject({ connected: false })
    expect(connectGitHub).not.toHaveBeenCalled()
    expect(usePicxStore(pinia).connection.phase).toBe('disconnected')
    expect(localStorage.getItem(LS_AUTHORIZATION)).toBeNull()
  })

  it('旧持久化 code 在读取后失效清空', () => {
    localStorage.setItem(LS_AUTHORIZATION, JSON.stringify({ code: 'fixture-stale-code', codeCreateTime: 1 }))
    usePicxStore(pinia).$reset()
    expect(usePicxStore(pinia).getGitHubAuthorizationInfo.code).toBe('')
    expect(JSON.parse(localStorage.getItem(LS_AUTHORIZATION) ?? '{}').code).toBe('')
  })
})
