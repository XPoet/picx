import type { UploadBatchResult } from '@/common/model/upload'
import type { ImageProcessingResult, processImage } from '@/services/image-processing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useUploadWorkspace } from '@/composables/use-upload-workspace'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import * as uploadApi from '@/utils/upload-utils'
import { createRepositoryFixture, fixtureRepository } from '../fixtures/ui-redesign'

vi.mock('@/utils/upload-utils', () => ({ uploadFilesToGitHub: vi.fn() }))
const scopes: ReturnType<typeof effectScope>[] = []
const original = new File(['x'], 'a.png', { type: 'image/png' })
const input = () => ({ uuid: crypto.randomUUID(), file: original, base64: 'data:image/png;base64,eA==' })
const processed = async (file: File): Promise<ImageProcessingResult> => ({ finalFile: file, watermarkFile: null, watermarkBase64: null, compressFile: null, compressBase64: null, skippedProcessing: false })
function setup(process: typeof processImage = processed, onReset = vi.fn(), inputBusy?: () => boolean) {
  const scope = effectScope()
  scopes.push(scope)
  const workspace = scope.run(() => useUploadWorkspace(process, { onReset, inputBusy }))
  if (!workspace)
    throw new Error('Missing workspace')
  return { scope, workspace, onReset }
}
function key(target: EventTarget, name: string, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: name, ctrlKey: true, bubbles: true, cancelable: true, ...options })
  target.dispatchEvent(event)
  return event
}
beforeEach(() => {
  localStorage.clear()
  const store = usePicxStore(pinia)
  store.$reset()
  Object.assign(store.getUserConfigInfo, createRepositoryFixture(), { token: 'fixture-invalid-credential' })
  store.connection = { phase: 'connected', attemptId: 1, repository: fixtureRepository, visibility: 'public', verifiedAt: 0 }
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  vi.mocked(uploadApi.uploadFilesToGitHub).mockReset()
})
afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop())
})
describe('快捷键与资源拥有者', () => {
  it('输入、contenteditable、弹窗、预览、repeat、组合输入和失焦均不接管', async () => {
    const { workspace } = setup()
    workspace.addFiles([input()])
    await vi.waitFor(() => expect(workspace.ready.value).toHaveLength(1))
    for (const tag of ['input', 'textarea', 'select', 'div']) {
      const element = document.createElement(tag)
      if (tag === 'div')
        element.setAttribute('contenteditable', '')
      document.body.append(element)
      expect(key(element, 'a').defaultPrevented).toBe(false)
      element.remove()
    }
    for (const selector of ['dialog', 'preview']) {
      const element = document.createElement('div')
      if (selector === 'dialog')
        element.setAttribute('role', 'dialog')
      else element.className = 'el-image-viewer__wrapper'
      document.body.append(element)
      expect(key(document.body, 'a').defaultPrevented).toBe(false)
      element.remove()
    }
    for (const options of [{ repeat: true }, { isComposing: true }, { altKey: true }, { shiftKey: true }])
      expect(key(document.body, 's', options).defaultPrevented).toBe(false)
    vi.mocked(document.hasFocus).mockReturnValue(false)
    expect(key(document.body, 'a').defaultPrevented).toBe(false)
    expect(workspace.queue.value).toHaveLength(1)
    expect(uploadApi.uploadFilesToGitHub).not.toHaveBeenCalled()
  })
  it('可用时 A 重置，S 与按钮共享上传锁，scope 结束取消请求且不发布晚到结果', async () => {
    const { workspace, scope, onReset } = setup()
    workspace.addFiles([input()])
    await vi.waitFor(() => expect(workspace.canReset.value).toBe(true))
    expect(key(document.body, 'a').defaultPrevented).toBe(true)
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(workspace.queue.value).toEqual([])
    workspace.addFiles([input()])
    await vi.waitFor(() => expect(workspace.canUpload.value).toBe(true))
    let finish: ((result: UploadBatchResult) => void) | undefined
    vi.mocked(uploadApi.uploadFilesToGitHub).mockImplementation(() => new Promise(resolve => finish = resolve))
    expect(key(document.body, 's').defaultPrevented).toBe(true)
    expect(key(document.body, 's').defaultPrevented).toBe(false)
    expect(uploadApi.uploadFilesToGitHub).toHaveBeenCalledTimes(1)
    const signal = vi.mocked(uploadApi.uploadFilesToGitHub).mock.calls[0][2]?.signal
    scope.stop()
    expect(signal?.aborted).toBe(true)
    finish?.({ batchId: 'stale', target: { ...fixtureRepository, dir: '/', resolvedAt: 0 }, attemptedUuids: [], successes: [], failures: [] })
    await nextTick()
    expect(usePicxStore(pinia).uploadBatches).toEqual([])
    expect(usePicxStore(pinia).uploadTargetBusy).toBe(false)
    expect(key(document.body, 'a').defaultPrevented).toBe(false)
  })
  it('移除和重置立即终止处理，不等待卡片或失效 Promise 完成', async () => {
    const signals: AbortSignal[] = []
    const process = vi.fn((...args: Parameters<typeof import('@/services/image-processing').processImage>) => {
      signals.push(args[2])
      return new Promise<ImageProcessingResult>(() => {})
    })
    const { workspace } = setup(process)
    const first = input()
    workspace.addFiles([first])
    await vi.waitFor(() => expect(signals).toHaveLength(1))
    workspace.remove(first.uuid)
    expect(signals[0].aborted).toBe(true)
    workspace.addFiles([input()])
    await vi.waitFor(() => expect(signals).toHaveLength(2))
    workspace.reset()
    expect(signals[1].aborted).toBe(true)
    expect(workspace.queue.value).toEqual([])
    expect(workspace.runtime.value).toEqual({})
  })
  it('页面键盘和在线状态监听按同一函数引用清理', () => {
    const addDocument = vi.spyOn(document, 'addEventListener')
    const removeDocument = vi.spyOn(document, 'removeEventListener')
    const addWindow = vi.spyOn(window, 'addEventListener')
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    const { scope } = setup()
    scope.stop()
    const keyboard = addDocument.mock.calls.find(call => call[0] === 'keydown')?.[1]
    expect(keyboard).toBeTypeOf('function')
    expect(removeDocument).toHaveBeenCalledWith('keydown', keyboard)
    for (const name of ['online', 'offline']) {
      const handler = addWindow.mock.calls.find(call => call[0] === name)?.[1]
      expect(removeWindow).toHaveBeenCalledWith(name, handler)
    }
  })
  it('读取中的文件阻止抢先上传，空队列也可取消未完成选择', async () => {
    const reading = ref(true)
    const { workspace, onReset } = setup(processed, vi.fn(), () => reading.value)
    expect(workspace.canReset.value).toBe(true)
    workspace.reset()
    expect(onReset).toHaveBeenCalledTimes(1)
    workspace.addFiles([input()])
    await vi.waitFor(() => expect(workspace.ready.value).toHaveLength(1))
    expect(workspace.canUpload.value).toBe(false)
    reading.value = false
    expect(workspace.canUpload.value).toBe(true)
  })
})
