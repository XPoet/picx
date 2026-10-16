import type { QueueItemRuntime } from '@/common/model/upload'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import i18n from '@/plugins/vue/i18n'
import { createNamedUploadImage } from '@/utils/upload-naming'
import UploadImageCard from '@/views/upload-image/components/upload-image-card/upload-image-card.vue'
import { createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

function card(state: 'processing' | 'failed' | 'forbidden') {
  const settings = createSettingsFixture()
  const image = createNamedUploadImage({ uuid: 'fixture-card', file: new File(['x'], 'a.png', { type: 'image/png' }), base64: 'data:image/png;base64,eA==' }, settings.imageName)
  const base = { uuid: image.uuid, generation: 1, settings: { ...settings, revision: 1 } }
  const runtime: QueueItemRuntime = state === 'processing' ? { ...base, phase: 'processing', step: 'compress' } : state === 'failed' ? { ...base, phase: 'failed', source: 'processing', reason: 'encode' } : { ...base, phase: 'failed', source: 'upload', result: { uuid: image.uuid, target: { ...fixtureRepository, dir: '/', resolvedAt: 0 }, stage: 'ref', error: { kind: 'forbidden', retryable: false } } }
  const wrapper = mount(UploadImageCard, { props: { imgObj: image, runtime, naming: settings.imageName, disabled: false }, global: { plugins: [i18n], stubs: { ElDialog: true } } })
  return { wrapper, image }
}
describe('队列动作根据真实运行态提供', () => {
  it('处理失败可发起重试而不修改传入文件；处理中仅提供详情与移除', async () => {
    const { wrapper, image } = card('failed')
    await wrapper.get('button[aria-label="重试处理"]').trigger('click')
    expect(wrapper.emitted('retry')).toEqual([[image.uuid]])
    expect(image.fileInfo.compressFile).toBeNull()
    wrapper.unmount()
    const processing = card('processing').wrapper
    expect(processing.find('button[aria-label="重试处理"]').exists()).toBe(false)
    expect(processing.find('button[aria-label="移除 a.png"]').exists()).toBe(true)
    processing.unmount()
  })
  it('权限失败使用本地化原因，不把上传重试混为重新处理', () => {
    const { wrapper } = card('forbidden')
    expect(wrapper.get('[role="alert"]').text()).toBe('没有访问权限，请检查仓库授权。')
    expect(wrapper.find('button[aria-label="重试处理"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
