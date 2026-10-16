import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseCloudSettings, saveCloudSettings } from '@/common/api/settings'
import { LS_SETTINGS } from '@/common/constant/storage'
import { CompressEncoderEnum, ImageSortEnum } from '@/common/model'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import request from '@/utils/request'
import { createCloudSettingsFixture, createLegacySettingsFixture, createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/utils/request', () => ({ default: vi.fn() }))

describe('旧设置兼容与云文件边界', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(request).mockReset()
    usePicxStore(pinia).$reset()
  })

  it('恢复旧本地偏好时保留原名、前缀、编码器与裸 URL 行为并补默认值', async () => {
    const legacy = createLegacySettingsFixture()
    localStorage.setItem(LS_SETTINGS, JSON.stringify(legacy))
    usePicxStore(pinia).$reset()

    const settings = store.getters.getUserSettings
    expect(settings.imageName).toEqual({ ...legacy.imageName, enableTimestamp: false })
    expect(settings.compress).toEqual({ enable: false, encoder: CompressEncoderEnum.mozJPEG })
    expect(settings.imageLinkType.selected).toBe('Fixture CDN')
    expect(settings.imageLinkType.presetList['Fixture CDN']).toEqual(legacy.imageLinkType.presetList['Fixture CDN'])
    expect(settings.imageLinkFormat.enable).toBe(false)
    expect(settings.imageLinkFormat.selected).toBe('BBCode')
    expect(settings.watermark).toEqual({ ...legacy.watermark, rotate: -20, gap: 80 })
    expect(settings.management.sort).toBe(ImageSortEnum.default)
    expect(settings.deploy.customDomain).toBe('')

    await store.dispatch('USER_SETTINGS_PERSIST')
    expect(JSON.parse(localStorage.getItem(LS_SETTINGS) ?? 'null')).toEqual(settings)
  })

  it('解析包含中文水印的旧云设置，不将缺失字段误判为损坏', () => {
    const legacy = createLegacySettingsFixture()
    expect(parseCloudSettings(createCloudSettingsFixture(legacy))).toEqual(legacy)
  })

  it('损坏的云文件返回失败空值，不能冒充有效设置', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(parseCloudSettings({ sha: 'fixture-corrupt', content: 'not-valid-base64%%' })).toBeNull()
    expect(parseCloudSettings({ sha: 'fixture-null', content: btoa('null') })).toBeNull()
  })

  it('云保存只序列化偏好，不包含仓库上下文或凭据字段', async () => {
    vi.mocked(request).mockResolvedValueOnce(null).mockResolvedValueOnce('SUCCESS')
    const settings = store.getters.getUserSettings
    expect(await saveCloudSettings(settings, createRepositoryFixture())).toBe(true)

    const payload: unknown = vi.mocked(request).mock.calls[1]?.[0].data
    if (!payload || typeof payload !== 'object' || !('content' in payload) || typeof payload.content !== 'string') {
      throw new Error('Expected a cloud settings content payload')
    }
    const bytes = Uint8Array.from(atob(payload.content), char => char.charCodeAt(0))
    const cloudSettings: unknown = JSON.parse(new TextDecoder().decode(bytes))
    expect(cloudSettings).toEqual(settings)
    for (const key of ['token', 'manualToken', 'code', 'owner', 'repo', 'branch', 'selectedDir', 'selectedDirList']) {
      expect(cloudSettings).not.toHaveProperty(key)
    }
    expect(vi.mocked(request).mock.calls[1]?.[0].method).toBe('PUT')
  })
})
