import type { UploadedImageModel } from '@/common/model'
import { mount } from '@vue/test-utils'
import { ElButton, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@/plugins/vue/i18n'
import { managementPropertiesImage, showMediaProperties } from '@/services/management-actions'
import MediaPropertiesDialog from '@/views/imgs-management/components/media-properties-dialog/media-properties-dialog.vue'

const image = (overrides: Partial<UploadedImageModel> = {}): UploadedImageModel => ({ type: 'image', uuid: 'image', sha: 'sha', dir: '/', path: '1111.webp', name: '1111.webp', size: 141076, checked: false, deleting: false, ...overrides })
const global = {
  plugins: [i18n],
  components: { ElButton, ElDescriptions, ElDescriptionsItem },
  stubs: { ElDialog: { props: ['modelValue'], template: '<section v-if="modelValue"><slot /><slot name="footer" /></section>' } },
}

afterEach(() => {
  managementPropertiesImage.value = null
})

describe('媒体属性弹窗', () => {
  it('名称只显示一次，根目录和大小带独立标签', async () => {
    const source = image()
    showMediaProperties(source)
    const wrapper = mount(MediaPropertiesDialog, { props: { image: managementPropertiesImage.value }, global })
    expect(wrapper.text().match(/1111\.webp/g)).toHaveLength(1)
    const rows = wrapper.findAll('tr')
    expect(rows).toHaveLength(4)
    expect(rows[0].text()).toContain('文件名称')
    expect(rows[1].text()).toBe('所在目录/')
    expect(rows[2].text()).toBe('文件类型图片')
    expect(rows[3].text()).toContain('137.77 KB')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:image')).toEqual([[null]])
    wrapper.unmount()
  })

  it('子目录显示目录本身，视频类型正常显示', () => {
    const wrapper = mount(MediaPropertiesDialog, { props: { image: image({ type: 'video', name: 'clip.mp4', dir: 'albums/2026', path: 'albums/2026/clip.mp4' }) }, global })
    expect(wrapper.text().match(/clip\.mp4/g)).toHaveLength(1)
    expect(wrapper.findAll('tr')[1].text()).toBe('所在目录/albums/2026')
    expect(wrapper.findAll('tr')[2].text()).toBe('文件类型视频')
    wrapper.unmount()
  })

  it.each([0, -1, Number.NaN])('未知或无效体积显示未知（%s）', (size) => {
    const wrapper = mount(MediaPropertiesDialog, { props: { image: image({ size }) }, global })
    expect(wrapper.findAll('tr')[3].text()).toBe('文件大小未知')
    expect(wrapper.text()).not.toContain('NaN')
    wrapper.unmount()
  })
})
