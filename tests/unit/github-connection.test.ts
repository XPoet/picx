import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/common/api/connection'
import { INIT_REPO_NAME, LS_CONFIG } from '@/common/constant'
import { DirModeEnum } from '@/common/model'
import { useGithubConnection } from '@/composables/use-github-connection'
import { connectGitHub } from '@/services/github-connection'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/common/api/connection', () => ({
  verifyGitHubAccount: vi.fn(),
  getConnectionInstallations: vi.fn(),
  getConnectionRepository: vi.fn(),
  createConnectionRepository: vi.fn(),
  verifyConnectionBranch: vi.fn(),
  getConnectionBranches: vi.fn(),
  initializeConnectionRepository: vi.fn(),
}))

const account = { id: 42, login: 'fixture-owner', name: 'Fixture', email: null, avatar_url: '' }
const repository = { owner: { login: account.login }, name: INIT_REPO_NAME, private: false, default_branch: 'actual-default', permissions: { push: true } }
const missing = { ok: false, error: { kind: 'not-found', status: 404, retryable: false } } as const
const input = { token: 'fixture-invalid-credential', mode: 'token' as const, previous: { owner: '', repo: '', branch: '' } }
const run = (previous = input.previous, current = () => true) => connectGitHub({ ...input, previous }, () => {}, current)

beforeEach(() => {
  vi.restoreAllMocks()
  vi.resetAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  usePicxStore(pinia).$reset()
  vi.mocked(api.verifyGitHubAccount).mockResolvedValue({ ok: true, data: account })
  vi.mocked(api.getConnectionInstallations).mockResolvedValue({ ok: true, data: { installations: [{ id: 7 }] } })
  vi.mocked(api.getConnectionRepository).mockResolvedValue({ ok: true, data: repository })
  vi.mocked(api.createConnectionRepository).mockResolvedValue({ ok: true, data: repository })
  vi.mocked(api.verifyConnectionBranch).mockResolvedValue({ ok: true, data: { name: 'actual-default' } })
  vi.mocked(api.getConnectionBranches).mockResolvedValue({ ok: true, data: [] })
  vi.mocked(api.initializeConnectionRepository).mockResolvedValue({ ok: true, data: { commit: { sha: 'fixture-commit' } } })
})

describe('可重入的 GitHub 连接与初始化', () => {
  it('首次初始化仅在确认 404 后创建，并验证真实默认分支', async () => {
    vi.mocked(api.getConnectionRepository).mockResolvedValueOnce(missing)
    vi.mocked(api.verifyConnectionBranch).mockResolvedValueOnce(missing)
    expect(await run()).toMatchObject({ ok: true, data: { repository: { branch: 'actual-default' }, reuseDirectory: false } })
    expect(api.createConnectionRepository).toHaveBeenCalledTimes(1)
    expect(api.initializeConnectionRepository).toHaveBeenCalledWith(input.token, account.login, INIT_REPO_NAME, 'actual-default')
  })

  it('已有仓库复用已保存分支，重连保留目录与浏览路径', async () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture(), {
      token: 'fixture-old',
      branch: 'custom-branch',
      dirMode: DirModeEnum.newDir,
      selectedDir: 'albums/旧目录',
      selectedDirList: ['albums', '旧目录'],
      viewDir: 'other',
    })
    expect(await useGithubConnection().connect(input.token)).toBe(true)
    expect(api.createConnectionRepository).not.toHaveBeenCalled()
    expect(api.initializeConnectionRepository).not.toHaveBeenCalled()
    expect(api.verifyConnectionBranch).toHaveBeenCalledWith(input.token, account.login, INIT_REPO_NAME, 'custom-branch')
    expect(store.getUserConfigInfo).toMatchObject({ selectedDir: 'albums/旧目录', selectedDirList: ['albums', '旧目录'], viewDir: 'other', branch: 'custom-branch' })
    expect(store.connection).toMatchObject({ phase: 'connected', visibility: 'public' })
  })

  it('已指定的仓库 / 分支不可访问时不创建或替换', async () => {
    vi.mocked(api.getConnectionRepository).mockResolvedValueOnce(missing)
    expect(await run(createRepositoryFixture())).toEqual(missing)
    expect(api.createConnectionRepository).not.toHaveBeenCalled()
    vi.mocked(api.verifyConnectionBranch).mockResolvedValueOnce(missing)
    vi.mocked(api.getConnectionBranches).mockResolvedValueOnce({ ok: true, data: [{ name: 'different-branch' }] })
    expect(await run(createRepositoryFixture())).toEqual(missing)
    expect(api.initializeConnectionRepository).not.toHaveBeenCalled()
  })

  it('部分初始化失败后重试复用已创建仓库', async () => {
    vi.mocked(api.getConnectionRepository).mockResolvedValueOnce(missing)
    vi.mocked(api.verifyConnectionBranch).mockResolvedValueOnce(missing).mockResolvedValueOnce(missing)
    vi.mocked(api.initializeConnectionRepository).mockResolvedValueOnce({ ok: false, error: { kind: 'network', retryable: true } })
    expect(await run()).toMatchObject({ ok: false, error: { kind: 'network' } })
    expect(await run()).toMatchObject({ ok: true })
    expect(api.createConnectionRepository).toHaveBeenCalledTimes(1)
    expect(api.initializeConnectionRepository).toHaveBeenCalledTimes(2)
  })

  it('创建冲突重新读取，权限失败不冒充安装缺失', async () => {
    vi.mocked(api.getConnectionRepository).mockResolvedValueOnce(missing)
    vi.mocked(api.createConnectionRepository).mockResolvedValueOnce({ ok: false, error: { kind: 'service', status: 422, retryable: false } })
    expect(await run()).toMatchObject({ ok: true })
    vi.mocked(api.getConnectionRepository).mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', status: 403, retryable: false } })
    expect(await run()).toMatchObject({ ok: false, error: { kind: 'forbidden' } })
    expect(api.createConnectionRepository).toHaveBeenCalledTimes(1)
  })

  it('app 未安装仅由安装列表确认，失败不提交凭据', async () => {
    vi.mocked(api.getConnectionInstallations).mockResolvedValueOnce({ ok: true, data: { installations: [] } })
    expect(await useGithubConnection().connect(input.token, 'oauth')).toBe(false)
    expect(usePicxStore(pinia).connection).toMatchObject({ phase: 'failed', error: { kind: 'app-not-installed' } })
    expect(localStorage.getItem(LS_CONFIG)).toBeNull()
    expect(api.getConnectionRepository).not.toHaveBeenCalled()
  })

  it('重复触发共用当前尝试，登出后旧响应不能提交或继续写仓库', async () => {
    let resolveAccount: (value: Awaited<ReturnType<typeof api.verifyGitHubAccount>>) => void = () => {}
    vi.mocked(api.verifyGitHubAccount).mockImplementationOnce(() => new Promise((resolve) => {
      resolveAccount = resolve
    }))
    const connection = useGithubConnection()
    const first = connection.connect(input.token)
    expect(connection.connect(input.token)).toBe(first)
    usePicxStore(pinia).LOGOUT()
    resolveAccount({ ok: true, data: account })
    expect(await first).toBe(false)
    expect(api.getConnectionRepository).not.toHaveBeenCalled()
    expect(localStorage.getItem(LS_CONFIG)).toBeNull()
    expect(usePicxStore(pinia).connection).toEqual({ phase: 'disconnected' })
    expect(usePicxStore(pinia).getGitHubAuthorizationInfo.token).toBe('')
  })

  it('验证失败保留旧配置，本地保存失败不发布候选', async () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture())
    const original = JSON.stringify(store.getUserConfigInfo)
    localStorage.setItem(LS_CONFIG, original)
    vi.mocked(api.verifyGitHubAccount).mockResolvedValueOnce({ ok: false, error: { kind: 'unauthenticated', status: 401, retryable: false } })
    expect(await useGithubConnection().connect(input.token)).toBe(false)
    expect(JSON.stringify(store.getUserConfigInfo)).toBe(original)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    expect(await useGithubConnection().connect(input.token)).toBe(false)
    expect(store.connection).toMatchObject({ phase: 'failed', error: { kind: 'storage-unavailable' } })
    expect(JSON.stringify(store.getUserConfigInfo)).toBe(original)
  })
})
