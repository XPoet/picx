import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, it } from 'vitest'
import WatermarkConfigBox from '@/components/watermark-config-box/watermark-config-box.vue'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { changeNamingMode, namingMode, validPrefix, validWatermark } from '@/utils/upload-preferences'
import { createLegacySettingsFixture, createSettingsFixture } from '../fixtures/ui-redesign'

const store = usePicxStore(pinia)
beforeEach(() => {
  localStorage.clear()
  store.$reset()
})
describe('上传处理偏好兼容与提交', () => {
  it('旧原名保持不变，时间戳不删除前缀，切回恢复前缀', () => {
    localStorage.setItem('PICX_IH_SETTINGS', JSON.stringify(createLegacySettingsFixture()))
    store.$reset()
    const original = store.getUserSettings.imageName
    expect(namingMode(original)).toBe('original')
    const saved = { ...original, addPrefix: { enable: true, prefix: 'keep-' } }
    expect(store.SAVE_UPLOAD_PREFERENCES({ imageName: changeNamingMode(saved, 'timestamp') })).toBe(true)
    expect(store.getUserSettings.imageName.addPrefix).toEqual(saved.addPrefix)
    expect(store.SAVE_UPLOAD_PREFERENCES({ imageName: changeNamingMode(store.getUserSettings.imageName, 'hash') })).toBe(true)
    expect(store.getUserSettings.imageName).toEqual({ ...saved, enableHash: true })
  })
  it('非法参数不写本地且不改 Store；四个编码器与五种位置均保留', () => {
    const snapshot = JSON.stringify(store.getUserSettings)
    expect(store.SAVE_UPLOAD_PREFERENCES({ watermark: { ...store.getUserSettings.watermark, fontSize: NaN } })).toBe(false)
    expect(JSON.stringify(store.getUserSettings)).toBe(snapshot)
    expect(localStorage.getItem('PICX_IH_SETTINGS')).toBeNull()
    expect(validPrefix('../bad')).toBe(false)
    expect(validPrefix('picx-')).toBe(true)
    const watermark = createSettingsFixture().watermark
    expect(validWatermark(watermark)).toBe(true)
    for (const key of ['fontSize', 'opacity', 'rotate', 'gap'] as const)
      expect(validWatermark({ ...watermark, [key]: Infinity })).toBe(false)
    store.uploadTargetBusy = true
    expect(store.SAVE_UPLOAD_PREFERENCES({ compress: { ...store.getUserSettings.compress, enable: false } })).toBe(false)
  })
  it('水印挂载保留旧 32px，文字编辑完成才发事件；无效数值不发事件', async () => {
    const value = createSettingsFixture().watermark
    const wrapper = mount(WatermarkConfigBox, { props: { modelValue: value }, global: { plugins: [ElementPlus], mocks: { $t: (key: string) => key } } })
    expect(wrapper.emitted('watermarkConfig')).toBeUndefined()
    const input = wrapper.get('input[type="text"]')
    ;(input.element as HTMLInputElement).value = '新水印'
    await input.trigger('input')
    expect(wrapper.emitted('watermarkConfig')).toBeUndefined()
    await input.trigger('change')
    expect(wrapper.emitted('watermarkConfig')?.[0]?.[0]).toMatchObject({ text: '新水印', fontSize: 32 })
    const numeric = wrapper.findAllComponents({ name: 'ElInputNumber' })[0]
    await numeric.vm.$emit('update:modelValue', undefined)
    await numeric.vm.$emit('change', undefined)
    expect(wrapper.emitted('watermarkConfig')).toHaveLength(1)
    wrapper.unmount()
  })
})
