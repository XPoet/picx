import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useUploadWorkspace } from '@/composables/use-upload-workspace'
import i18n from '@/plugins/vue/i18n'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { compressImage } from '@/utils/compress-image'
import { createNamedUploadImage } from '@/utils/upload-naming'
import UploadImageCard from '@/views/upload-image/components/upload-image-card/upload-image-card.vue'

vi.mock('@/utils/compress-image', () => ({ compressImage: vi.fn() }))
vi.mock('@/utils/image-utils', async importOriginal => ({
  ...await importOriginal<typeof import('@/utils/image-utils')>(),
  imgFileToBase64: vi.fn(async () => 'data:image/png;base64,eA=='),
}))

enableAutoUnmount(afterEach)

beforeEach(() => {
  usePicxStore(pinia).$reset()
  vi.mocked(compressImage).mockReset()
})

function create(type = 'image/png') {
  const store = usePicxStore(pinia)
  store.getUserSettings.compress.enable = true
  store.getUserSettings.watermark.enable = false
  const image = createNamedUploadImage({
    uuid: 'compression-loading',
    file: new File(['original'], 'image.png', { type }),
    base64: 'data:image/png;base64,b3JpZ2luYWw=',
  }, store.getUserSettings.imageName)
  store.UPLOAD_IMG_LIST_ADD(image)
  const wrapper = mount(defineComponent({
    setup() {
      const workspace = useUploadWorkspace()
      return () => h(UploadImageCard, {
        imgObj: store.getUploadImageList[0],
        runtime: store.uploadRuntime[image.uuid],
        naming: store.getUserSettings.imageName,
        disabled: false,
        onRetry: workspace.retryProcessing,
      })
    },
  }), {
    global: {
      plugins: [i18n],
      stubs: {
        ElDialog: { template: '<div />' },
        ElButton: { template: '<button><slot /></button>' },
      },
    },
  })
  return { wrapper, image, store }
}

describe('上传队列中的压缩 loading', () => {
  it('编码及预览完成前显示转圈和正在压缩，完成后显示压缩体积和待上传', async () => {
    let finish!: (file: File) => void
    vi.mocked(compressImage).mockImplementationOnce(() => new Promise(resolve => finish = resolve))
    const { wrapper, image, store } = create()
    expect(store.uploadRuntime[image.uuid]).toMatchObject({ phase: 'processing', step: 'compress' })
    expect(wrapper.get('.queue-status').text()).toBe('正在压缩')
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(true)
    expect(wrapper.get('.queue-file-size').text()).not.toContain('大小不变')
    expect(wrapper.find('.upload-loading').exists()).toBe(false)
    const compressed = new File(['x'], 'image.png', { type: 'image/png' })
    finish(compressed)
    await flushPromises()
    expect(wrapper.get('.queue-status').text()).toBe('待上传')
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(false)
    expect(wrapper.get('.queue-file-size strong').text()).toBe('1 B')
    expect(image.fileInfo.compressFile).toBe(compressed)
  })

  it('压缩失败后停止转圈，重试时恢复 loading', async () => {
    let fail!: (error: Error) => void
    vi.mocked(compressImage).mockImplementationOnce(() => new Promise((_, reject) => fail = reject))
    const { wrapper } = create()
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(true)
    fail(new Error('encode failed'))
    await flushPromises()
    expect(wrapper.get('.queue-status').text()).toBe('失败')
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(false)
    vi.mocked(compressImage).mockImplementationOnce(() => new Promise(() => {}))
    await wrapper.get('button[title="重试处理"]').trigger('click')
    expect(wrapper.get('.queue-status').text()).toBe('正在压缩')
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(true)
  })

  it('跳过压缩的格式直接进入待上传状态', async () => {
    const { wrapper } = create('image/gif')
    await flushPromises()
    expect(compressImage).not.toHaveBeenCalled()
    expect(wrapper.get('.queue-status').text()).toBe('待上传')
    expect(wrapper.find('.queue-status .is-loading').exists()).toBe(false)
    expect(wrapper.get('.queue-file-size').text()).toContain('大小不变')
  })
})
