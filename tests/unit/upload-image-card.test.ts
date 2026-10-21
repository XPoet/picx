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
  const wrapper = mount(UploadImageCard, { props: { imgObj: image, runtime, naming: settings.imageName, disabled: false }, global: { plugins: [i18n], stubs: { ElDialog: { name: 'ElDialog', props: ['modelValue'], template: '<div />' }, ElButton: { template: '<button><slot /></button>' } } } })
  return { wrapper, image }
}
describe('队列动作根据真实运行态提供', () => {
  it('上传时仅在状态栏显示 loading，并禁用缩略图详情入口', async () => {
    const { wrapper, image } = card('processing')
    expect(wrapper.find('.upload-loading').exists()).toBe(false)
    await wrapper.setProps({ disabled: true, imgObj: { ...image, uploadStatus: { ...image.uploadStatus, uploading: true } } })
    expect(wrapper.find('.upload-loading').exists()).toBe(false)
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(true)
    expect(wrapper.get('.media-thumbnail').attributes('disabled')).toBeDefined()
    await wrapper.get('.media-thumbnail').trigger('click')
    expect(wrapper.findComponent({ name: 'ElDialog' }).props('modelValue')).toBe(false)
    expect(wrapper.get('.queue-status').text()).toContain('正在上传')
    const runtime = wrapper.props('runtime')!
    await wrapper.setProps({ imgObj: { ...image, uploadStatus: { ...image.uploadStatus, uploading: false } }, runtime: { ...runtime, phase: 'uploading', batchId: 'batch', stage: 'blob' } })
    expect(wrapper.get('.queue-status').text()).toBe('等待提交')
    expect(wrapper.find('.upload-loading').exists()).toBe(false)
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(false)
    await wrapper.setProps({ disabled: false, imgObj: { ...image, uploadStatus: { ...image.uploadStatus, uploading: false, progress: 100 } } })
    expect(wrapper.get('.media-thumbnail').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.upload-loading').exists()).toBe(false)
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(false)
    expect(wrapper.get('.queue-status').text()).toContain('已上传')
    wrapper.unmount()
  })
  it('处理失败可发起重试而不修改传入文件；处理中仅提供详情与移除', async () => {
    const { wrapper, image } = card('failed')
    await wrapper.get('button[title="重试处理"]').trigger('click')
    expect(wrapper.emitted('retry')).toEqual([[image.uuid]])
    expect(image.fileInfo.compressFile).toBeNull()
    wrapper.unmount()
    const processing = card('processing').wrapper
    expect(processing.find('button[title="重试处理"]').exists()).toBe(false)
    expect(processing.find('button[title="移除 a.png"]').exists()).toBe(true)
    processing.unmount()
  })
  it('权限失败使用本地化原因，不把上传重试混为重新处理', () => {
    const { wrapper } = card('forbidden')
    expect(wrapper.get('[role="alert"]').text()).toBe('没有访问权限，请检查仓库授权。')
    expect(wrapper.find('button[title="重试处理"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
