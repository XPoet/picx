import type { EffectScope } from 'vue'
import type { ApiResult } from '@/utils/request/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { getCloudSettings, saveCloudSettingsResult } from '@/common/api/settings'
import { useCloudSettingsSync } from '@/composables/use-cloud-settings-sync'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { clearSettingsSync, retrySettingsSync, settingsSyncState } from '@/stores/settings-sync-state'
import { createRepositoryFixture, createSettingsFixture } from '../fixtures/ui-redesign'

vi.mock('@/common/api/settings', () => ({ getCloudSettings: vi.fn(), saveCloudSettingsResult: vi.fn() }))
const store = usePicxStore(pinia)
let scope: EffectScope
const cloud = () => ({ ok: true, data: { kind: 'present', file: { sha: 'fixture-sha', content: '' }, settings: createSettingsFixture() } }) as const
const failure = { ok: false, error: { kind: 'forbidden', retryable: false } } as const
async function flush() {
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
  await nextTick()
}
function start(twice = false) {
  scope = effectScope()
  scope.run(() => {
    useCloudSettingsSync()
    if (twice)
      useCloudSettingsSync()
  })
}
beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  store.$reset()
  clearSettingsSync()
  Object.assign(store.getUserConfigInfo, createRepositoryFixture())
  vi.mocked(getCloudSettings).mockReset().mockResolvedValue(cloud())
  vi.mocked(saveCloudSettingsResult).mockReset().mockResolvedValue({ ok: true, data: null })
})
afterEach(() => {
  scope?.stop()
  vi.useRealTimers()
})
describe('单实例云同步与修订竞争', () => {
  it('首次拉取只执行一次，不产生回声推送；有效本地修订才同步', async () => {
    start(true)
    await flush()
    expect(getCloudSettings).toHaveBeenCalledTimes(1)
    expect(saveCloudSettingsResult).not.toHaveBeenCalled()
    expect(settingsSyncState.value.phase).toBe('synced')
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: true } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(701)
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(1)
    expect(settingsSyncState.value.phase).toBe('synced')
  })
  it('查询失败或损坏不播种；显式重试验证远端后推送本地', async () => {
    vi.mocked(getCloudSettings).mockResolvedValueOnce(failure)
    start()
    await flush()
    expect(settingsSyncState.value.phase).toBe('failed')
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: false } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(701)
    expect(saveCloudSettingsResult).not.toHaveBeenCalled()
    retrySettingsSync()
    await flush()
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(1)
    expect(store.getUserSettings.compress.enable).toBe(false)
  })
  it('只有合法不存在才播种一次', async () => {
    vi.mocked(getCloudSettings).mockResolvedValueOnce({ ok: true, data: { kind: 'missing' } })
    start()
    await flush()
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(1)
  })
  it('推送快照不受后续修改影响，旧修订成功后还要推送最新修订', async () => {
    let complete: (value: ApiResult<unknown>) => void = () => {}
    vi.mocked(saveCloudSettingsResult).mockReturnValueOnce(new Promise((resolve) => {
      complete = resolve
    }))
    start()
    await flush()
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: true } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(701)
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: false } })
    await nextTick()
    expect(vi.mocked(saveCloudSettingsResult).mock.calls[0]?.[0].compress.enable).toBe(true)
    complete({ ok: true, data: null })
    await flush()
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(2)
    expect(vi.mocked(saveCloudSettingsResult).mock.calls[1]?.[0].compress.enable).toBe(false)
    expect(settingsSyncState.value.phase).toBe('synced')
  })
  it('拉取期间的新本地修订不会被旧云设置覆盖；登出使旧结果失效', async () => {
    let complete: (value: Awaited<ReturnType<typeof getCloudSettings>>) => void = () => {}
    vi.mocked(getCloudSettings).mockReturnValueOnce(new Promise((resolve) => {
      complete = resolve
    }))
    start()
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: false } })
    complete(cloud())
    await flush()
    expect(store.getUserSettings.compress.enable).toBe(false)
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(1)
    store.USER_CONFIG_INFO_LOGOUT()
    await flush()
    expect(settingsSyncState.value.phase).toBe('idle')
  })
  it('离线保留本地修订，恢复网络后可重试；本地失败保留有效编辑候选', async () => {
    start()
    await flush()
    const offline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: true } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(701)
    expect(saveCloudSettingsResult).not.toHaveBeenCalled()
    expect(settingsSyncState.value).toMatchObject({ phase: 'failed', scope: 'cloud' })
    offline.mockRestore()
    retrySettingsSync()
    await flush()
    expect(saveCloudSettingsResult).toHaveBeenCalledTimes(1)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('fixture-quota')
    })
    expect(store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: false } })).toBe(false)
    expect(store.getUserSettings.compress.enable).toBe(true)
    expect(settingsSyncState.value).toMatchObject({ phase: 'failed', scope: 'local' })
    write.mockRestore()
    retrySettingsSync()
    await flush()
    expect(store.getUserSettings.compress.enable).toBe(false)
  })
  it('登出后迟到的拉取不会覆盖重连的新设置', async () => {
    let complete: (value: Awaited<ReturnType<typeof getCloudSettings>>) => void = () => {}
    vi.mocked(getCloudSettings).mockReturnValueOnce(new Promise((resolve) => {
      complete = resolve
    }))
    start()
    store.USER_CONFIG_INFO_LOGOUT()
    Object.assign(store.getUserConfigInfo, createRepositoryFixture())
    await flush()
    store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: true } })
    complete(cloud())
    await flush()
    expect(store.getUserSettings.compress.enable).toBe(true)
    expect(getCloudSettings).toHaveBeenCalledTimes(2)
    expect(saveCloudSettingsResult).not.toHaveBeenCalled()
  })
})
