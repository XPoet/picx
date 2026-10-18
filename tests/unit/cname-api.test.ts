import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCloudCnameFile, isValidCustomDomain, normalizeCustomDomain, syncCloudCnameFileResult } from '@/common/api/deploy'
import { requestResult } from '@/utils/request'
import { fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/utils/request', () => ({ requestResult: vi.fn() }))
const missing = { ok: false, error: { kind: 'not-found', retryable: false } } as const
const file = (domain = 'old.example.test', sha = 'fixture-cname') => ({ ok: true, data: { sha, content: btoa(domain) } }) as const
const written = { ok: true, data: { commit: { sha: 'fixture-commit' } } } as const
beforeEach(() => vi.mocked(requestResult).mockReset())
describe('cNAME typed transaction', () => {
  it('复用规范化并限制 DNS 主机名，不接受端口或超长地址', () => {
    expect(normalizeCustomDomain(' HTTPS://Images.Example.test/photos/ ')).toBe('images.example.test')
    expect(isValidCustomDomain('images.example.test')).toBe(true)
    expect(isValidCustomDomain('example.test:443')).toBe(false)
    expect(isValidCustomDomain(`${'a.'.repeat(126)}test`)).toBe(false)
  })
  it('创建 / 更新使用正确 branch 和 sha，一致时不写入', async () => {
    vi.mocked(requestResult).mockResolvedValueOnce(missing).mockResolvedValueOnce(written)
    expect(await syncCloudCnameFileResult(fixtureRepository, 'images.example.test')).toEqual({ ok: true, data: { status: 'created' } })
    expect(vi.mocked(requestResult).mock.calls[1]?.[0]).toMatchObject({ method: 'PUT', data: { branch: fixtureRepository.branch, content: btoa('images.example.test') } })
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(file()).mockResolvedValueOnce(written)
    expect(await syncCloudCnameFileResult(fixtureRepository, 'images.example.test')).toEqual({ ok: true, data: { status: 'updated' } })
    expect(vi.mocked(requestResult).mock.calls[1]?.[0].data).toMatchObject({ sha: 'fixture-cname' })
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(file('images.example.test'))
    expect(await syncCloudCnameFileResult(fixtureRepository, 'images.example.test')).toEqual({ ok: true, data: { status: 'consistent' } })
    expect(requestResult).toHaveBeenCalledTimes(1)
  })
  it('清空需明确允许且 sha 未变化；取消 / 竞争不发送 DELETE', async () => {
    vi.mocked(requestResult).mockResolvedValueOnce(file())
    expect((await syncCloudCnameFileResult(fixtureRepository, '')).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(file('new.example.test', 'changed'))
    expect((await syncCloudCnameFileResult(fixtureRepository, '', fixtureRepository.branch, { allowDelete: true, expectedSha: 'fixture-cname' })).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(file()).mockResolvedValueOnce(written)
    expect(await syncCloudCnameFileResult(fixtureRepository, '', fixtureRepository.branch, { allowDelete: true, expectedSha: 'fixture-cname' })).toEqual({ ok: true, data: { status: 'deleted' } })
    expect(vi.mocked(requestResult).mock.calls[1]?.[0]).toMatchObject({ method: 'DELETE', data: { branch: fixtureRepository.branch, sha: 'fixture-cname' } })
  })
  it('404 才能跳过，权限 / 损坏 / 失效任务都不写入', async () => {
    vi.mocked(requestResult).mockResolvedValueOnce(missing)
    expect(await syncCloudCnameFileResult(fixtureRepository, '')).toEqual({ ok: true, data: { status: 'skipped' } })
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', retryable: false } })
    expect((await syncCloudCnameFileResult(fixtureRepository, 'images.example.test')).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(file('%%%'))
    expect((await getCloudCnameFile(fixtureRepository)).ok).toBe(false)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(missing)
    expect((await syncCloudCnameFileResult(fixtureRepository, 'images.example.test', fixtureRepository.branch, { current: () => false })).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
  })
})
