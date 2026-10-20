import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadSettingsPanel from '@/views/upload-image/components/upload-settings-panel.vue'
import { createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

function panel() {
  const settings = createSettingsFixture()
  return mount(UploadSettingsPanel, { props: { settings, target: fixtureRepository, directory: '/', displayPath: '/', pendingCount: 0, pendingBytes: 0, uploadedCount: 0, hasItems: false, busy: false, processing: false, canUpload: false, shortcut: 'Ctrl' }, global: { mocks: { $t: (key: string) => key }, stubs: { ImageLinkPreview: true, ElSelect: { props: ['modelValue', 'disabled'], emits: ['update:modelValue'], template: '<select :value="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>' }, ElOption: { props: ['value', 'label'], template: '<option :value="value">{{ label }}</option>' }, ElSwitch: { props: ['modelValue', 'disabled'], emits: ['update:modelValue'], template: '<button :disabled="disabled" @click="$emit(\'update:modelValue\', !modelValue)">switch</button>' }, ElButton: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' } } } })
}
describe('快捷设置展示契约', () => {
  it('链接格式、格式预览和部署区域仅在有上传成功结果时显示，清空后隐藏', async () => {
    const wrapper = panel()
    for (const uploadedCount of [0, 1, 0]) {
      await wrapper.setProps({ uploadedCount })
      expect(wrapper.find('.copy-format').exists()).toBe(uploadedCount > 0)
      expect(wrapper.findComponent({ name: 'ImageLinkPreview' }).exists()).toBe(uploadedCount > 0)
      expect(wrapper.find('.workspace-deployment').exists()).toBe(uploadedCount > 0)
    }
    wrapper.unmount()
  })
  it('旧转换关闭显示 raw；选择格式只发事件而不改 props，空队列不能上传', async () => {
    const wrapper = panel()
    expect(wrapper.find('select').exists()).toBe(false)
    await wrapper.setProps({ uploadedCount: 1 })
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('raw')
    await wrapper.get('select').setValue('BBCode')
    expect(wrapper.emitted('format')).toEqual([['BBCode']])
    expect(wrapper.props('settings').imageLinkFormat.enable).toBe(false)
    await wrapper.setProps({ uploadedCount: 0 })
    expect(wrapper.findAll('button').filter(button => button.text() === 'upload')[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
  it('压缩 / 水印 Props Down Events Up，上传锁禁用编辑，操作区显示简洁按钮', async () => {
    const wrapper = panel()
    const buttons = wrapper.findAll('.preference-switch button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('compress')).toEqual([[true]])
    expect(wrapper.emitted('watermark')).toEqual([[false]])
    await wrapper.setProps({ busy: true, displayPath: '/saved/target', pendingCount: 2, pendingBytes: 1536, uploadedCount: 1 })
    expect(wrapper.find('.upload-totals').exists()).toBe(false)
    expect(wrapper.find('.workspace-actions kbd').exists()).toBe(false)
    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
