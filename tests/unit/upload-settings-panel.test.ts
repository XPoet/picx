import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadSettingsPanel from '@/views/upload-image/components/upload-settings-panel.vue'
import { createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

function panel() {
  const settings = createSettingsFixture()
  return mount(UploadSettingsPanel, { props: { settings, target: fixtureRepository, directory: '/', displayPath: '/', pendingCount: 0, pendingBytes: 0, uploadedCount: 0, hasItems: false, busy: false, processing: false, canUpload: false, shortcut: 'Ctrl' }, global: { mocks: { $t: (key: string) => key }, stubs: { ImageLinkPreview: true, ElSwitch: { props: ['modelValue', 'disabled'], emits: ['update:modelValue'], template: '<button :disabled="disabled" @click="$emit(\'update:modelValue\', !modelValue)">switch</button>' }, ElButton: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' } } } })
}
describe('快捷设置展示契约', () => {
  it('旧转换关闭显示 raw；选择格式只发事件而不改 props，空队列不能上传', async () => {
    const wrapper = panel()
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('raw')
    await wrapper.get('select').setValue('BBCode')
    expect(wrapper.emitted('format')).toEqual([['BBCode']])
    expect(wrapper.props('settings').imageLinkFormat.enable).toBe(false)
    expect(wrapper.findAll('button').filter(button => button.text().includes('upload_workspace.upload_count'))[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
  it('压缩 / 水印 Props Down Events Up，上传锁禁用编辑，目录与总大小可回显', async () => {
    const wrapper = panel()
    const buttons = wrapper.findAll('.preference-switch button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('compress')).toEqual([[true]])
    expect(wrapper.emitted('watermark')).toEqual([[false]])
    await wrapper.setProps({ busy: true, displayPath: '/saved/target', pendingCount: 2, pendingBytes: 1536 })
    expect(wrapper.get('[data-testid="saved-upload-directory"]').text()).toBe('/saved/target')
    expect(wrapper.get('.upload-totals').text()).toContain('1.5 KB')
    expect(wrapper.get('select').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
