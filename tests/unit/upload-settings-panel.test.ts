import { enableAutoUnmount, mount } from '@vue/test-utils'
import { ElButton, ElOption, ElSelect, ElSwitch } from 'element-plus'
import { afterEach, describe, expect, it } from 'vitest'
import UploadSettingsPanel from '@/views/upload-image/components/upload-settings-panel.vue'
import { createSettingsFixture, fixtureRepository } from '../fixtures/ui-redesign'

enableAutoUnmount(afterEach)

function panel() {
  return mount(UploadSettingsPanel, {
    props: {
      settings: createSettingsFixture(),
      target: fixtureRepository,
      directory: '/',
      displayPath: '/',
      pendingCount: 0,
      pendingBytes: 0,
      uploadedCount: 0,
      hasItems: false,
      busy: false,
      processing: false,
      canUpload: false,
      shortcut: 'Ctrl',
    },
    global: {
      mocks: { $t: (key: string) => key },
      components: { ElButton, ElOption, ElSelect, ElSwitch },
      stubs: { ImageLinkPreview: true, SettingsSyncFeedback: true },
    },
  })
}

describe('快捷设置展示契约', () => {
  it('成功后显示格式、预览与部署区域；格式只发事件，清空后隐藏', async () => {
    const wrapper = panel()
    const expectResults = (visible: boolean) => {
      expect(wrapper.findComponent(ElSelect).exists()).toBe(visible)
      expect(wrapper.findComponent({ name: 'ImageLinkPreview' }).exists()).toBe(visible)
      expect(wrapper.find('.workspace-deployment').exists()).toBe(visible)
    }
    expectResults(false)
    await wrapper.setProps({ uploadedCount: 1 })
    expectResults(true)
    const format = wrapper.getComponent(ElSelect)
    expect(format.props('modelValue')).toBe('raw')
    format.vm.$emit('update:modelValue', 'HTML')
    expect(wrapper.emitted('format')).toEqual([['HTML']])
    expect(wrapper.props('settings').imageLinkFormat.enable).toBe(false)
    expect(wrapper.props('settings').imageLinkFormat.selected).toBe('BBCode')
    await wrapper.setProps({ uploadedCount: 0 })
    expectResults(false)
  })

  it('空队列禁用操作，允许上传时发出事件；压缩、水印与上传锁由 props 控制', async () => {
    const wrapper = panel()
    const upload = wrapper.get('.workspace-actions .el-button--primary')
    const reset = wrapper.get('.workspace-actions .el-button--warning')
    expect(upload.attributes('disabled')).toBeDefined()
    expect(reset.attributes('disabled')).toBeDefined()
    await upload.trigger('click')
    expect(wrapper.emitted('upload')).toBeUndefined()
    await wrapper.setProps({ hasItems: true, pendingCount: 1, canUpload: true })
    await upload.trigger('click')
    await reset.trigger('click')
    expect(wrapper.emitted('upload')).toEqual([[]])
    expect(wrapper.emitted('reset')).toEqual([[]])

    const switches = wrapper.findAllComponents(ElSwitch)
    switches[0].vm.$emit('update:modelValue', true)
    switches[1].vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('compress')).toEqual([[true]])
    expect(wrapper.emitted('watermark')).toEqual([[false]])
    expect(wrapper.props('settings').compress.enable).toBe(false)
    expect(wrapper.props('settings').watermark.enable).toBe(true)
    await wrapper.setProps({ busy: true, uploadedCount: 1, canUpload: false })
    expect(switches.every(component => component.props('disabled'))).toBe(true)
    expect(wrapper.getComponent(ElSelect).props('disabled')).toBe(true)
    expect(upload.attributes('disabled')).toBeDefined()
    expect(reset.attributes('disabled')).toBeDefined()
  })
})
