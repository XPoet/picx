import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadContentsResult, uploadHeadResult, uploadRefResult } from '@/common/api/upload-results'
import client from '@/utils/request/axios'
import { fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/utils/request/axios', () => ({ default: { request: vi.fn() } }))
beforeEach(() => vi.mocked(client.request).mockReset())
describe('上传响应结构验证', () => {
  it('ref 必须指向本次 commit，不能用任意成功响应确认上传', async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ status: 200, data: { object: { sha: 'another-commit' } } })
    expect(await uploadRefResult(fixtureRepository, 'expected')).toEqual({ ok: false, error: { kind: 'invalid-response', retryable: true } })
    vi.mocked(client.request).mockResolvedValueOnce({ status: 200, data: { object: { sha: 'expected' } } })
    expect(await uploadRefResult(fixtureRepository, 'expected')).toEqual({ ok: true, data: { object: { sha: 'expected' } } })
  })
  it('contents 缺少 commit 或实际 size 不能当作成功', async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ status: 201, data: { content: { name: 'a.png', path: 'a.png', sha: 'a', size: 7 } } })
    expect((await uploadContentsResult(fixtureRepository, 'a.png', 'eA==')).ok).toBe(false)
    vi.mocked(client.request).mockResolvedValueOnce({ status: 201, data: { content: { name: 'a.png', path: 'a.png', sha: 'a', size: -1 }, commit: { sha: 'commit' } } })
    expect((await uploadContentsResult(fixtureRepository, 'a.png', 'eA==')).ok).toBe(false)
  })
  it('head 缺 tree SHA 返回结构失败，特殊路径编码后请求不含凭据副本', async () => {
    vi.mocked(client.request).mockResolvedValueOnce({ status: 200, data: { commit: { sha: 'commit' } } })
    expect((await uploadHeadResult(fixtureRepository)).ok).toBe(false)
    vi.mocked(client.request).mockResolvedValueOnce({ status: 201, data: {} })
    await uploadContentsResult(fixtureRepository, '图 #?/a.png', 'eA==')
    const config = vi.mocked(client.request).mock.calls[1][0]
    expect(config.url).toContain('%E5%9B%BE%20%23%3F/a.png')
    expect(config).not.toHaveProperty('token')
  })
})
