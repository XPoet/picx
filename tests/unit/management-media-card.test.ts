import type { UploadedImageModel } from '@/common/model'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import ImageCard from '@/views/imgs-management/components/image-card/image-card.vue'

function card(type: 'image' | 'video' = 'image') {
  const image: UploadedImageModel = Object.freeze({ type, uuid: 'card', sha: 'sha', dir: '/', path: type === 'video' ? 'clip.mp4' : 'card.png', name: type === 'video' ? 'clip.mp4' : 'card.png', size: 0, checked: false, deleting: false })
  const settings = store.getters.getUserSettings
  settings.imageLinkType.presetList.Test = { id: 'test', name: 'Test', rule: 'https://images.example.test/{{path}}' }
  settings.imageLinkType.selected = 'Test'
  return mount(ImageCard, {
    props: { imageObj: image, selected: false },
    global: { plugins: [i18n], directives: { loading: {}, contextmenu: {} }, stubs: { ElDropdown: { template: '<div><slot /><slot name="dropdown" /></div>' }, ElDropdownMenu: true, ElDropdownItem: true, ElImageViewer: true, ElDialog: { template: '<div><slot /></div>' } } },
  })
}

describe('受控媒体卡片', () => {
  it('选择、复制和加载通过事件上报，未知体积不伪造', async () => {
    const wrapper = card()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('select')).toEqual([[true]])
    expect(wrapper.props('imageObj').checked).toBe(false)
    await wrapper.get('.copy-link').trigger('click')
    expect(wrapper.emitted('action')).toContainEqual(['copy'])
    const image = wrapper.get('img')
    Object.defineProperties(image.element, { naturalWidth: { value: 640 }, naturalHeight: { value: 480 } })
    await image.trigger('load')
    expect(wrapper.emitted('availability')).toEqual([[true]])
    expect(wrapper.text()).toContain('640 × 480')
    expect(wrapper.text()).not.toContain('0 KB')
    await image.trigger('error')
    expect(wrapper.text()).not.toContain('640 × 480')
    expect(wrapper.text()).not.toContain('0 × 0')
    await wrapper.setProps({ busy: true })
    expect(wrapper.get('input[type="checkbox"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.media-more').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('视频列表与显式预览均不自动播放，预览使用原生 controls', async () => {
    const wrapper = card('video')
    expect(wrapper.get('video').attributes('autoplay')).toBeUndefined()
    await wrapper.get('.image-preview').trigger('click')
    expect(wrapper.get('video.video-preview').attributes('controls')).toBeDefined()
    expect(wrapper.get('video.video-preview').attributes('autoplay')).toBeUndefined()
    wrapper.unmount()
  })
})
