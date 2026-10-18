import type { DeploymentObservation } from '@/common/model/deployment'
import type { ApiResult } from '@/utils/request/types'
import { describe, expect, it, vi } from 'vitest'
import { checkoutGhPagesBranch } from '@/common/api/branch'
import { configurePages, queryPagesDeployment } from '@/common/api/pages'
import { createDeploymentService } from '@/services/github-deployment'
import { requestResult } from '@/utils/request'
import { fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/utils/request', () => ({ default: vi.fn(), requestResult: vi.fn() }))
const target = { ...fixtureRepository }
const available = { ok: true, data: { phase: 'available', commitSha: 'new-sha', url: 'https://images.example.test/' } } as const
const waiting = { ok: true, data: { phase: 'waiting', commitSha: 'new-sha' } } as const
const forbidden = { ok: false, error: { kind: 'forbidden', status: 403, retryable: false } } as const
const notFound = { ok: false, error: { kind: 'not-found', status: 404, retryable: false } } as const
function deferred<T>() {
  let complete: (value: T) => void = () => {}
  const promise = new Promise<T>((resolve) => {
    complete = resolve
  })
  return { promise, complete }
}
describe('部署阶段与失效边界', () => {
  it('提交并不表示可用；轮询超时仍等待，手动检查可转为可用', async () => {
    const query = vi.fn().mockResolvedValue(waiting)
    const submit = vi.fn().mockResolvedValue({ ok: true, data: { commitSha: 'new-sha' } })
    const service = createDeploymentService({ target: () => target, query, submit, pollLimit: 3, pause: async () => {} })
    const action = service.deploy()
    expect(service.busy.value).toBe(true)
    await action
    expect(service.state.value.phase).toBe('waiting')
    expect(query).toHaveBeenCalledTimes(3)
    query.mockResolvedValue(available)
    expect((await service.check()).phase).toBe('available')
    expect(submit).toHaveBeenCalledTimes(1)
  })
  it('重复调用只执行一次；权限失败不自动变成功', async () => {
    const operation = deferred<ApiResult<{ commitSha: string }>>()
    const submit = vi.fn(() => operation.promise)
    const service = createDeploymentService({ target: () => target, query: vi.fn().mockResolvedValue(forbidden), submit })
    const first = service.deploy()
    expect(service.deploy()).toBe(first)
    operation.complete({ ok: true, data: { commitSha: 'new-sha' } })
    expect((await first).phase).toBe('failed')
    expect(submit).toHaveBeenCalledTimes(1)
  })
  it('登出 / 换仓后旧响应不能覆盖新目标，取消确认不查询构建', async () => {
    const old = deferred<ApiResult<DeploymentObservation>>()
    let current: typeof target | null = target
    const query = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue(available)
    const service = createDeploymentService({ target: () => current, query, submit: async () => null })
    const first = service.check()
    current = null
    service.reset()
    old.complete(available)
    await first
    expect(service.state.value.phase).toBe('idle')
    current = target
    await service.deploy()
    expect(service.state.value.phase).toBe('idle')
    expect(query).toHaveBeenCalledTimes(1)
  })
})
describe('pages 证据判定', () => {
  function responses(status: string, commit: string) {
    vi.mocked(requestResult).mockReset()
    vi.mocked(requestResult).mockResolvedValueOnce({ ok: true, data: { object: { sha: 'new-sha' } } }).mockResolvedValueOnce({ ok: true, data: { status, html_url: 'https://images.example.test/', source: { branch: 'gh-pages', path: '/' } } }).mockResolvedValueOnce({ ok: true, data: { status, commit } })
  }
  it('旧构建、构建中和最新构建不存在均等待；匹配提交且 built 才可用', async () => {
    responses('built', 'old-sha')
    expect(await queryPagesDeployment(target, 'new-sha')).toEqual(waiting)
    responses('building', 'new-sha')
    expect(await queryPagesDeployment(target, 'new-sha')).toEqual(waiting)
    responses('built', 'new-sha')
    expect(await queryPagesDeployment(target, 'new-sha')).toEqual(available)
    responses('built', 'new-sha')
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: true, data: { object: { sha: 'new-sha' } } }).mockResolvedValueOnce(notFound)
    expect(await queryPagesDeployment(target, 'new-sha')).toEqual(waiting)
  })
  it('无权限保持失败，错误构建失败，初次分支不存在明确未部署', async () => {
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(forbidden)
    expect(await queryPagesDeployment(target)).toEqual(forbidden)
    vi.mocked(requestResult).mockResolvedValueOnce(notFound).mockResolvedValueOnce({ ok: true, data: { name: target.repo } })
    expect(await queryPagesDeployment(target)).toEqual({ ok: true, data: { phase: 'not-deployed' } })
    responses('errored', 'new-sha')
    expect(await queryPagesDeployment(target)).toEqual({ ok: false, error: { kind: 'service', retryable: true } })
  })
  it('pages 查询失败不能伪装不存在后创建站点', async () => {
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(forbidden)
    expect(await configurePages(target, () => true)).toEqual(forbidden)
    expect(requestResult).toHaveBeenCalledTimes(1)
  })
})

describe('分支提交安全边界', () => {
  it('不允许未确认重建；源分支获取失败不删除目标分支', async () => {
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: true, data: { object: { sha: 'source-sha' } } }).mockResolvedValueOnce({ ok: true, data: { object: { sha: 'old-sha' } } })
    expect((await checkoutGhPagesBranch(target)).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(2)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce(forbidden)
    expect(await checkoutGhPagesBranch(target, true)).toEqual(forbidden)
    expect(requestResult).toHaveBeenCalledTimes(1)
  })
  it('创建目标分支后只返回提交 SHA，不等待计时器或切换来源', async () => {
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: true, data: { object: { sha: 'new-sha' } } }).mockResolvedValueOnce(notFound).mockResolvedValueOnce({ ok: true, data: { object: { sha: 'new-sha' } } })
    expect(await checkoutGhPagesBranch(target)).toEqual({ ok: true, data: { commitSha: 'new-sha' } })
    expect(vi.mocked(requestResult).mock.calls[2]?.[0]).toMatchObject({ method: 'POST', data: { ref: 'refs/heads/gh-pages', sha: 'new-sha' } })
  })
})
