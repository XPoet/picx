import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDirInfoListResult } from '@/common/api/dir'
import { LS_CONFIG } from '@/common/constant'
import request, { requestResult } from '@/utils/request'
import client from '@/utils/request/axios'

const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
const response = (status: number, data: unknown, headers: Record<string, string> = {}): AxiosAdapter => async (config) => {
  const res = { status, data, statusText: '', config, headers: new AxiosHeaders(headers) }
  if (status >= 400) {
    throw new AxiosError('remote-private-message', 'ERR_BAD_RESPONSE', config, undefined, res)
  }
  return res
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('类型化请求与兼容调用', () => {
  it('空数组有效，非法目录数据不能冒充空目录', async () => {
    expect(await requestResult({ adapter: response(200, []) }, isArray)).toEqual({ ok: true, data: [] })
    const requestSpy = vi.spyOn(client, 'request')
    requestSpy.mockResolvedValueOnce({ data: [], status: 200, headers: {} })
    expect(await getDirInfoListResult({ owner: 'fixture', repo: 'media', branch: 'main' })).toEqual({ ok: true, data: [] })
    requestSpy.mockResolvedValueOnce({ data: { message: 'private' }, status: 200, headers: {} })
    expect(await getDirInfoListResult({ owner: 'fixture', repo: 'media', branch: 'main' })).toEqual({ ok: false, error: { kind: 'invalid-response', retryable: true } })
  })

  it.each([
    [401, {}, 'unauthenticated'],
    [403, {}, 'forbidden'],
    [404, {}, 'not-found'],
    [403, { 'x-ratelimit-remaining': '0' }, 'rate-limited'],
    [403, { 'retry-after': '30' }, 'rate-limited'],
    [429, {}, 'rate-limited'],
    [409, {}, 'conflict'],
    [503, {}, 'service'],
  ])('按状态码与响应头区分 %s', async (status, headers, kind) => {
    const result = await requestResult({ adapter: response(status, { message: 'must-not-escape' }, headers) }, isArray)
    expect(result).toMatchObject({ ok: false, error: { kind, status } })
    expect(JSON.stringify(result)).not.toContain('must-not-escape')
    expect(JSON.stringify(result)).not.toContain('remote-private-message')
  })

  it('显式离线与普通网络失败可区分，限流包含等待时间', async () => {
    const adapter: AxiosAdapter = async () => {
      throw new Error('sensitive')
    }
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await requestResult({ adapter }, isArray)).toEqual({ ok: false, error: { kind: 'offline', retryable: true } })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    expect(await requestResult({ adapter }, isArray)).toEqual({ ok: false, error: { kind: 'network', retryable: true } })
    expect(await requestResult({ adapter: response(429, null, { 'retry-after': '12' }) }, isArray)).toMatchObject({ error: { retryAfterMs: 12000 } })
  })

  it('旧调用方保留 null、204 和显式 422 兼容，结果调用不接受 422', async () => {
    expect(await request({ adapter: response(204, ''), noShowErrMsg: true })).toBe('SUCCESS')
    expect(await request({ adapter: response(401, {}), noShowErrMsg: true })).toBeNull()
    expect(await request({ adapter: response(422, { compatible: true }), success422: true })).toEqual({ compatible: true })
    expect(await requestResult({ adapter: response(422, []), success422: true }, isArray)).toMatchObject({ ok: false })
  })

  it('显式鉴权优先，最终 URL 必须是精确可信 origin', async () => {
    // 全部是不可用于认证的模拟值，只在内存适配器内验证，不产生网络请求。
    localStorage.setItem(LS_CONFIG, JSON.stringify({ token: 'fixture-stored' }))
    const seen: InternalAxiosRequestConfig[] = []
    const adapter: AxiosAdapter = async (config) => {
      seen.push(config)
      return { data: [], status: 200, statusText: '', config, headers: {} }
    }
    await requestResult({ url: '/user', adapter, headers: { Authorization: 'Bearer fixture-draft' } }, isArray)
    await requestResult({ url: '/user', adapter }, isArray)
    await requestResult({ url: 'https://api.github.com.untrusted.test/user', adapter }, isArray)
    await requestResult({ baseURL: 'https://example.test', url: '/user', adapter }, isArray)
    await requestResult({ url: 'https://example.test', adapter, headers: { Authorization: 'Bearer fixture-draft' } }, isArray)
    expect(seen.map(item => item.headers.get('Authorization'))).toEqual([
      'Bearer fixture-draft',
      'Bearer fixture-stored',
      undefined,
      undefined,
      undefined,
    ])
  })
})
