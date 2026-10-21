import type { UploadedImageModel } from '@/common/model'
import type { ManagementBatchResult } from '@/common/model/management'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/plugins/vue/i18n'
import { changeManagementDirectory, deleteManagementMedia, relocateManagementMedia } from '@/services/management'
import { deleteMediaWithConfirmation, editDirectory, isManagementMediaLoading, managementBusy, managementOperation, renameMedia } from '@/services/management-actions'
import { store } from '@/stores'
import MoveImageDialog from '@/views/imgs-management/components/move-image-dialog/move-image-dialog.vue'

vi.mock('@/services/management', () => ({ deleteManagementMedia: vi.fn(), changeManagementDirectory: vi.fn(), relocateManagementMedia: vi.fn() }))

const confirm = vi.fn()
const prompt = vi.fn()
const image = (name: string): UploadedImageModel => ({ type: 'image', uuid: name, sha: name, dir: '/', path: name, name, size: 10, checked: false, deleting: false })

beforeEach(async () => {
  vi.resetAllMocks()
  managementBusy.value = false
  managementOperation.value = null
  vi.stubGlobal('ElMessageBox', { confirm, prompt })
  vi.stubGlobal('ElMessage', { success: vi.fn(), error: vi.fn(), warning: vi.fn() })
  store.commit('SET_UPLOAD_AREA_STATE', { isShowMoveImageDialog: false, moveImageInfo: null })
  await store.dispatch('SET_USER_CONFIG_INFO', { owner: 'fixture-owner', repo: 'fixture-repo', branch: 'main', logined: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('删除图片 loading', () => {
  it('确认后为目标图片开启 loading，阻止重复请求，部分失败后恢复', async () => {
    const images = [image('a.png'), image('b.png')]
    const other = image('other.png')
    let complete: (value: ManagementBatchResult) => void = () => {}
    confirm.mockResolvedValue('confirm')
    vi.mocked(deleteManagementMedia).mockImplementation(() => new Promise((resolve) => {
      complete = resolve
    }))
    const pending = deleteMediaWithConfirmation(images)
    expect(images.every(item => !item.deleting)).toBe(true)
    await vi.waitFor(() => expect(deleteManagementMedia).toHaveBeenCalledOnce())
    expect(images.every(isManagementMediaLoading)).toBe(true)
    expect(images.every(item => !item.deleting)).toBe(true)
    expect(isManagementMediaLoading(other)).toBe(false)
    expect(await deleteMediaWithConfirmation(images)).toBeNull()
    expect(deleteManagementMedia).toHaveBeenCalledOnce()
    complete({ successes: ['a.png'], failures: [{ path: 'b.png', sha: 'b.png', error: { kind: 'forbidden', retryable: false } }], cacheFailed: false })
    await pending
    expect(images.every(item => !item.deleting)).toBe(true)
    expect(managementBusy.value).toBe(false)
  })

  it('取消确认不会开启 loading 或发送删除请求', async () => {
    const target = image('a.png')
    confirm.mockRejectedValue('cancel')
    expect(await deleteMediaWithConfirmation([target])).toBeNull()
    expect(target.deleting).toBe(false)
    expect(deleteManagementMedia).not.toHaveBeenCalled()
    expect(managementBusy.value).toBe(false)
  })

  it('请求异常后清除 loading', async () => {
    const target = image('a.png')
    confirm.mockResolvedValue('confirm')
    vi.mocked(deleteManagementMedia).mockImplementation(async () => {
      expect(isManagementMediaLoading(target)).toBe(true)
      throw new Error('fixture failure')
    })
    expect(await deleteMediaWithConfirmation([target])).toBeNull()
    expect(target.deleting).toBe(false)
    expect(managementBusy.value).toBe(false)
  })
})

describe('删除目录 loading', () => {
  it.each([true, false])('确认后显示目标目录 loading，请求结束后恢复（成功：%s）', async (ok) => {
    let complete: (value: Awaited<ReturnType<typeof changeManagementDirectory>>) => void = () => {}
    confirm.mockResolvedValue('confirm')
    vi.mocked(changeManagementDirectory).mockImplementation(() => new Promise((resolve) => {
      complete = resolve
    }))
    const pending = editDirectory('albums/nested', 'delete')
    expect(managementOperation.value).toBeNull()
    await vi.waitFor(() => expect(changeManagementDirectory).toHaveBeenCalledOnce())
    expect(managementOperation.value).toMatchObject({ kind: 'delete', directory: 'albums/nested' })
    await editDirectory('other', 'delete')
    expect(changeManagementDirectory).toHaveBeenCalledOnce()
    complete(ok ? { ok: true, data: { cacheFailed: false } } : { ok: false, error: { kind: 'forbidden', retryable: false } })
    await pending
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
  })

  it('取消确认不触发 loading 和删除请求', async () => {
    confirm.mockRejectedValue('cancel')
    await editDirectory('albums', 'delete')
    expect(managementOperation.value).toBeNull()
    expect(changeManagementDirectory).not.toHaveBeenCalled()
    expect(managementBusy.value).toBe(false)
  })

  it('删除请求异常后清除 loading', async () => {
    confirm.mockResolvedValue('confirm')
    vi.mocked(changeManagementDirectory).mockImplementation(async () => {
      expect(managementOperation.value).toMatchObject({ kind: 'delete', directory: 'albums' })
      throw new Error('fixture failure')
    })
    await editDirectory('albums', 'delete')
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
  })
})

describe('重命名 loading', () => {
  it.each(['media', 'directory'] as const)('%s 重命名在请求期间显示 loading，成功后恢复', async (kind) => {
    let complete: (value: Awaited<ReturnType<typeof relocateManagementMedia>>) => void = () => {}
    prompt.mockResolvedValue({ value: 'renamed' })
    const request = kind === 'media' ? vi.mocked(relocateManagementMedia) : vi.mocked(changeManagementDirectory)
    request.mockImplementation(() => new Promise((resolve) => {
      complete = resolve
    }))
    const target = image('a.png')
    const pending = kind === 'media' ? renameMedia(target) : editDirectory('albums', 'rename')
    expect(managementOperation.value).toBeNull()
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce())
    expect(managementOperation.value).toMatchObject(kind === 'media'
      ? { kind: 'rename', media: [{ path: 'a.png', sha: 'a.png' }] }
      : { kind: 'rename', directory: 'albums' })
    await renameMedia(image('other.png'))
    expect(prompt).toHaveBeenCalledOnce()
    complete({ ok: true, data: { cacheFailed: false } })
    await pending
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
  })

  it.each(['media', 'directory'] as const)('%s 重命名取消后不执行请求', async (kind) => {
    prompt.mockRejectedValue('cancel')
    if (kind === 'media')
      await renameMedia(image('a.png'))
    else await editDirectory('albums', 'rename')
    expect(relocateManagementMedia).not.toHaveBeenCalled()
    expect(changeManagementDirectory).not.toHaveBeenCalled()
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
  })

  it('重命名异常后清除 loading', async () => {
    prompt.mockResolvedValue({ value: 'renamed.png' })
    vi.mocked(relocateManagementMedia).mockImplementation(async () => {
      expect(managementOperation.value?.kind).toBe('rename')
      throw new Error('fixture failure')
    })
    await renameMedia(image('a.png'))
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
  })
})

describe('移动弹窗 loading', () => {
  it('请求异常后恢复确认按钮并保留目标目录，支持再次提交', async () => {
    let rejectMove: (reason: Error) => void = () => {}
    vi.mocked(relocateManagementMedia).mockImplementation(() => new Promise((resolve, reject) => {
      rejectMove = reject
    }))
    const wrapper = mount(MoveImageDialog, {
      global: {
        plugins: [i18n],
        stubs: {
          ElDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>' },
          ElButton: { props: ['loading', 'disabled'], template: '<button :disabled="disabled || loading" :data-loading="Boolean(loading)"><slot /></button>' },
          RepoDirCascader: { props: ['disabled'], emits: ['update:modelValue'], template: `<button class="choose-directory" :disabled="disabled" @click="$emit('update:modelValue', ['albums'])">albums</button>` },
        },
      },
    })
    store.commit('SET_UPLOAD_AREA_STATE', { isShowMoveImageDialog: true, moveImageInfo: image('a.png') })
    await flushPromises()
    await wrapper.get('.choose-directory').trigger('click')
    const confirmButton = wrapper.findAll('button').find(button => button.text() === i18n.global.t('confirm'))!
    await confirmButton.trigger('click')
    expect(confirmButton.attributes('data-loading')).toBe('true')
    expect(wrapper.get('.choose-directory').attributes('disabled')).toBeDefined()
    expect(managementOperation.value).toMatchObject({ kind: 'move', media: [{ path: 'a.png', sha: 'a.png' }] })
    await confirmButton.trigger('click')
    expect(relocateManagementMedia).toHaveBeenCalledOnce()
    rejectMove(new Error('fixture failure'))
    await flushPromises()
    expect(confirmButton.attributes('data-loading')).toBe('false')
    expect(confirmButton.attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBeTruthy()
    expect(managementOperation.value).toBeNull()
    expect(managementBusy.value).toBe(false)
    vi.mocked(relocateManagementMedia).mockResolvedValue({ ok: true, data: { cacheFailed: false } })
    await confirmButton.trigger('click')
    await flushPromises()
    expect(relocateManagementMedia).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ path: 'a.png' }), 'albums')
    expect(managementOperation.value).toBeNull()
    expect(wrapper.find('.choose-directory').exists()).toBe(false)
    wrapper.unmount()
  })
})
