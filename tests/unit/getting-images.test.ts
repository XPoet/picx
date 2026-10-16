import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import GettingImages from '@/components/getting-images/getting-images.vue'

let id = 0
vi.mock('@/utils', async importOriginal => ({
  ...await importOriginal<typeof import('@/utils')>(),
  gettingFilesHandle: vi.fn(async (file: File, video: boolean) => /image\//.test(file.type) || (video && file.type === 'video/mp4') ? { uuid: `fixture-${++id}`, file, base64: 'data:fixture' } : null),
  isImage: (type: string) => type.startsWith('image/'),
  isVideo: (type: string) => type === 'video/mp4',
}))
const wrappers: ReturnType<typeof mount>[] = []
function create(props = {}) {
  const wrapper = mount(GettingImages, { props, attachTo: document.body, global: { mocks: { $t: (key: string) => key }, stubs: { ElButton: { template: '<button><slot /></button>' } } } })
  wrappers.push(wrapper)
  return wrapper
}
async function select(wrapper: ReturnType<typeof create>, files: File[]) {
  const input = wrapper.get('input').element as HTMLInputElement
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  await wrapper.get('input').trigger('change')
  return input
}
function paste(target: Element, file: File) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { items: [{ kind: 'file', type: file.type, getAsFile: () => file }] } })
  target.dispatchEvent(event)
  return event
}
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
})
describe('持续接收与默认预览', () => {
  it('多次选择、同名图片与 MP4 每次发送新结果，输入清空且工作区不变成预览', async () => {
    const wrapper = create({ mode: 'workspace', videoEnabled: true })
    const first = new File(['a'], 'same.png', { type: 'image/png' })
    await select(wrapper, [first])
    const input = await select(wrapper, [first, new File(['v'], 'clip.mp4', { type: 'video/mp4' })])
    expect(wrapper.emitted('getImgList')?.map(args => (args[0] as File[]).length)).toEqual([1, 2])
    expect(input.value).toBe('')
    expect(wrapper.find('.preview-img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
    const results = wrapper.emitted('getImgList')?.flatMap(args => args[0] as { uuid: string }[]) ?? []
    expect(new Set(results.map(result => result.uuid)).size).toBe(3)
  })
  it('默认模式保留图片工具的最后一张预览，实例 input ID 唯一', async () => {
    const wrapper = create()
    await select(wrapper, [new File(['x'], 'a.png', { type: 'image/png' })])
    expect(wrapper.get('.preview-img').attributes('alt')).toBe('a.png')
    const parent = mount({ render: () => h('div', [h(GettingImages), h(GettingImages)]) }, { global: { mocks: { $t: (key: string) => key } } })
    const ids = parent.findAll('input').map(input => input.attributes('id'))
    expect(new Set(ids).size).toBe(2)
    parent.unmount()
  })
  it('拖放和图片粘贴走同一入口，错误类型和禁用状态不发布', async () => {
    const wrapper = create({ mode: 'workspace' })
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await wrapper.trigger('drop', { dataTransfer: { files: [file] } })
    expect(paste(document.body, file).defaultPrevented).toBe(true)
    await vi.waitFor(() => expect(wrapper.emitted('getImgList')).toHaveLength(2))
    await select(wrapper, [new File(['x'], 'a.txt', { type: 'text/plain' })])
    await wrapper.setProps({ disabled: true })
    await select(wrapper, [file])
    await wrapper.trigger('drop', { dataTransfer: { files: [file] } })
    expect(paste(document.body, file).defaultPrevented).toBe(false)
    expect(wrapper.emitted('getImgList')).toHaveLength(2)
  })
  it('文本、contenteditable、弹窗中的粘贴不被接管，卸载移除监听', async () => {
    const wrapper = create({ mode: 'workspace' })
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    for (const tag of ['input', 'textarea', 'div']) {
      const element = document.createElement(tag)
      if (tag === 'div')
        element.setAttribute('contenteditable', '')
      document.body.append(element)
      expect(paste(element, file).defaultPrevented).toBe(false)
      element.remove()
    }
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)
    expect(paste(document.body, file).defaultPrevented).toBe(false)
    dialog.remove()
    wrapper.unmount()
    wrappers.pop()
    expect(paste(document.body, file).defaultPrevented).toBe(false)
    expect(wrapper.emitted('getImgList')).toBeUndefined()
  })
})
