import { ElMessageBox } from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkoutGhPagesBranch, getGitReference } from '@/common/api/branch'
import { CloudCnameSyncStatusEnum, getCloudCnameFile, syncCloudCnameFileResult } from '@/common/api/deploy'
import { configurePages, getPagesInfo, queryPagesDeployment } from '@/common/api/pages'
import { deployment, deploymentOnline, domainSaveFeedback, saveDomainAndDeploy } from '@/components/deploy-status-bar/deploy-status-bar.util'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/common/api/branch', () => ({ checkoutGhPagesBranch: vi.fn(), getGitReference: vi.fn() }))
vi.mock('@/common/api/pages', () => ({ configurePages: vi.fn(), getPagesInfo: vi.fn(), queryPagesDeployment: vi.fn() }))
vi.mock('@/common/api/deploy', async original => ({ ...await original<typeof import('@/common/api/deploy')>(), getCloudCnameFile: vi.fn(), syncCloudCnameFileResult: vi.fn() }))
const store = usePicxStore(pinia)
beforeEach(() => {
  localStorage.clear()
  store.$reset()
  Object.assign(store.getUserConfigInfo, createRepositoryFixture())
  deployment.reset()
  domainSaveFeedback.value = null
  deploymentOnline.value = true
  vi.mocked(getGitReference).mockReset().mockResolvedValue({ ok: false, error: { kind: 'not-found', retryable: false } })
  vi.mocked(getCloudCnameFile).mockReset().mockResolvedValue({ ok: true, data: { kind: 'missing' } })
  vi.mocked(syncCloudCnameFileResult).mockReset().mockResolvedValue({ ok: true, data: { status: CloudCnameSyncStatusEnum.created } })
  vi.mocked(checkoutGhPagesBranch).mockReset().mockResolvedValue({ ok: true, data: { commitSha: 'fixture-new' } })
  vi.mocked(getPagesInfo).mockReset().mockResolvedValue({ ok: false, error: { kind: 'not-found', retryable: false } })
  vi.mocked(configurePages).mockReset().mockResolvedValue({ ok: true, data: null })
  vi.mocked(queryPagesDeployment).mockReset().mockResolvedValue({ ok: true, data: { phase: 'available', commitSha: 'fixture-new', url: 'https://images.example.test/' } })
  vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')
})
afterEach(() => vi.restoreAllMocks())
describe('域名保存与部署编排', () => {
  it('规范化、本地保存、CNAME、分支依次完成，只有最后证据显示可用', async () => {
    const original = store.getUserSettings.imageLinkType.selected
    expect((await saveDomainAndDeploy('HTTPS://Images.Example.test/path')).phase).toBe('available')
    expect(store.getUserSettings.deploy.customDomain).toBe('images.example.test')
    expect(domainSaveFeedback.value).toMatchObject({ phase: 'available', localSaved: true, cnameStatus: 'created' })
    expect(vi.mocked(syncCloudCnameFileResult).mock.calls[0]?.[0]).not.toHaveProperty('token')
    expect(store.getUserSettings.imageLinkType.selected).toBe(original)
  })
  it('cNAME 失败阻止分支提交，保留本地和原链接；分支失败另行反馈', async () => {
    vi.mocked(syncCloudCnameFileResult).mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', retryable: false } })
    expect((await saveDomainAndDeploy('images.example.test')).phase).toBe('failed')
    expect(checkoutGhPagesBranch).not.toHaveBeenCalled()
    expect(store.getUserSettings.deploy.customDomain).toBe('images.example.test')
    expect(domainSaveFeedback.value).toMatchObject({ phase: 'failed', localSaved: true, scope: 'cname' })
    vi.mocked(checkoutGhPagesBranch).mockResolvedValueOnce({ ok: false, error: { kind: 'service', retryable: true } })
    await saveDomainAndDeploy('images.example.test')
    expect(domainSaveFeedback.value).toMatchObject({ phase: 'failed', localSaved: true, cnameStatus: 'created', scope: 'deployment' })
  })
  it('清空取消不保存 / 不同步，确认才带允许删除和原 sha', async () => {
    store.SAVE_SETTINGS_CANDIDATE({ deploy: { customDomain: 'old.example.test' } })
    vi.mocked(getCloudCnameFile).mockResolvedValue({ ok: true, data: { kind: 'present', domain: 'old.example.test', file: { sha: 'old-cname', content: btoa('old.example.test') } } })
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel')
    await saveDomainAndDeploy('')
    expect(store.getUserSettings.deploy.customDomain).toBe('old.example.test')
    expect(syncCloudCnameFileResult).not.toHaveBeenCalled()
    expect(domainSaveFeedback.value?.phase).toBe('cancelled')
    vi.mocked(syncCloudCnameFileResult).mockResolvedValueOnce({ ok: true, data: { status: CloudCnameSyncStatusEnum.deleted } })
    const retried = await saveDomainAndDeploy('')
    expect(retried.phase).toBe('available')
    expect(ElMessageBox.confirm).toHaveBeenCalledTimes(2)
    expect(store.getUserSettings.deploy.customDomain).toBe('')
    expect(vi.mocked(syncCloudCnameFileResult).mock.calls[0]?.[3]).toMatchObject({ allowDelete: true, expectedSha: 'old-cname' })
  })
  it('本地失败不启动 CNAME；重复提交不启动第二个执行实例', async () => {
    const local = vi.spyOn(store, 'SAVE_SETTINGS_CANDIDATE').mockReturnValueOnce(false)
    await saveDomainAndDeploy('images.example.test')
    expect(syncCloudCnameFileResult).not.toHaveBeenCalled()
    expect(domainSaveFeedback.value).toMatchObject({ phase: 'failed', scope: 'local', localSaved: false })
    local.mockRestore()
    const first = saveDomainAndDeploy('images.example.test')
    const second = saveDomainAndDeploy('other.example.test')
    await Promise.all([first, second])
    expect(syncCloudCnameFileResult).toHaveBeenCalledTimes(1)
    expect(store.getUserSettings.deploy.customDomain).toBe('images.example.test')
  })
  it('同一连接重验不改变会话号，新凭据与登出才使旧任务失效', () => {
    const config = createRepositoryFixture()
    const result = { account: { id: 42, login: config.owner, name: 'Fixture User', email: '', avatar_url: '' }, repository: { owner: config.owner, repo: config.repo, branch: config.branch }, visibility: 'public' as const, reuseDirectory: true }
    let attempt = store.BEGIN_GITHUB_CONNECTION()
    expect(store.COMMIT_GITHUB_CONNECTION(attempt, 'fixture-invalid-credential', 'token', result)).toBe(true)
    const session = store.connectionSessionId
    attempt = store.BEGIN_GITHUB_CONNECTION()
    expect(store.connectionSessionId).toBe(session)
    expect(store.COMMIT_GITHUB_CONNECTION(attempt, 'fixture-invalid-credential', 'token', result)).toBe(true)
    expect(store.connectionSessionId).toBe(session)
    attempt = store.BEGIN_GITHUB_CONNECTION()
    expect(store.COMMIT_GITHUB_CONNECTION(attempt, 'fixture-replacement', 'token', result)).toBe(true)
    expect(store.connectionSessionId).toBe(session + 1)
    store.LOGOUT()
    expect(store.connectionSessionId).toBe(session + 2)
  })
  it('源分支没有 CNAME，但 Pages 仍绑定域名时也需确认移除', async () => {
    vi.mocked(getPagesInfo).mockResolvedValue({ ok: true, data: { status: 'built', html_url: 'https://old.example.test/', cname: 'old.example.test', source: { branch: 'gh-pages', path: '/' } } })
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel')
    await saveDomainAndDeploy('')
    expect(ElMessageBox.confirm).toHaveBeenCalledTimes(1)
    expect(syncCloudCnameFileResult).not.toHaveBeenCalled()
    expect(domainSaveFeedback.value?.phase).toBe('cancelled')
  })
})
