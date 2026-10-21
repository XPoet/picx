import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCloudSettings, parseCloudSettings, saveCloudSettingsResult } from '@/common/api/settings'
import { requestResult } from '@/utils/request'
import { createCloudSettingsFixture, createLegacySettingsFixture, createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/utils/request', () => ({ requestResult: vi.fn() }))
beforeEach(() => vi.mocked(requestResult).mockReset())
describe('云偏好读取与写入边界', () => {
  it('旧字段可缺少；数组、错误类型与仅凭据对象不冒充偏好', () => {
    expect(parseCloudSettings(createCloudSettingsFixture(createLegacySettingsFixture()))?.imageName).not.toHaveProperty('enableTimestamp')
    for (const input of [[], { compress: { enable: 'yes' } }, { token: 'fixture-marker' }, { watermark: { fontSize: 'large' } }])
      expect(parseCloudSettings(createCloudSettingsFixture(input))).toBeNull()
  })
  it('递归投影排除未知 / 凭据字段，保存请求始终指定 branch 和 sha', async () => {
    const settings = createSettingsFixture()
    Object.assign(settings, { token: 'fixture-marker' })
    Object.assign(settings.watermark, { code: 'fixture-marker' })
    const file = createCloudSettingsFixture(settings)
    const parsed = parseCloudSettings(file)
    expect(parsed).not.toHaveProperty('token')
    expect(parsed?.watermark).not.toHaveProperty('code')
    vi.mocked(requestResult).mockResolvedValueOnce({ ok: true, data: file }).mockResolvedValueOnce({ ok: true, data: { content: { sha: 'saved' } } })
    expect((await saveCloudSettingsResult(settings, fixtureRepository)).ok).toBe(true)
    const payload = vi.mocked(requestResult).mock.calls[1]?.[0].data
    expect(payload).toMatchObject({ branch: fixtureRepository.branch, sha: file.sha })
    if (!payload || typeof payload !== 'object' || !('content' in payload) || typeof payload.content !== 'string')
      throw new Error('Expected preference payload')
    expect(atob(payload.content)).not.toContain('fixture-marker')
  })
  it('读取权限失败或内容损坏阻止 PUT，确认 404 才允许创建', async () => {
    vi.mocked(requestResult).mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', retryable: false } })
    expect((await saveCloudSettingsResult(createSettingsFixture(), fixtureRepository)).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: true, data: { sha: 'corrupt', content: '%%%' } })
    expect((await saveCloudSettingsResult(createSettingsFixture(), fixtureRepository)).ok).toBe(false)
    expect(requestResult).toHaveBeenCalledTimes(1)
    vi.mocked(requestResult).mockReset().mockResolvedValueOnce({ ok: false, error: { kind: 'not-found', retryable: false } })
    expect(await getCloudSettings(fixtureRepository)).toEqual({ ok: true, data: { kind: 'missing' } })
  })
})
