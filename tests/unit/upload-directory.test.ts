import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LS_CONFIG, NEW_DIR_COUNT_MAX } from '@/common/constant'
import { DirModeEnum } from '@/common/model'
import { useUploadDirectory } from '@/composables/use-upload-directory'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { directoryDraft, displayDirectory, resolveUploadTarget, validateDirectoryDraft } from '@/utils/directory-utils'
import { createUploadImageObject } from '@/utils/image-utils'
import { uploadUrlHandle } from '@/utils/upload-utils'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  usePicxStore(pinia).$reset()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('目录路径规则', () => {
  it('根目录存储为 /、显示为 /，新目录最多五层且保留内部字符', () => {
    expect(validateDirectoryDraft({ mode: DirModeEnum.rootDir, segments: [], inputPath: '' })).toEqual({ ok: true, value: { dirMode: 'rootDir', selectedDir: '/', selectedDirList: [] } })
    const path = ' 相 册.v1/图 #?/c/d/e '
    const result = validateDirectoryDraft({ mode: DirModeEnum.newDir, segments: [], inputPath: path })
    expect(result).toMatchObject({ ok: true, value: { selectedDir: path.trim(), selectedDirList: ['相 册.v1', '图 #?', 'c', 'd', 'e'] } })
    expect(NEW_DIR_COUNT_MAX).toBe(5)
    expect(displayDirectory('a/b')).toBe('/a/b')
    expect(displayDirectory('/')).toBe('/')
  })

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['/', 'empty'],
    ['a//b', 'empty-segment'],
    ['//a', 'empty-segment'],
    ['a//', 'empty-segment'],
    ['a/./b', 'dot-segment'],
    ['a/../b', 'dot-segment'],
    ['a\\b', 'backslash'],
    ['a/b/c/d/e/f', 'depth'],
    ['a\nb', 'control'],
  ])('非法路径 %j 返回字段错误 %s', (path, error) => {
    expect(validateDirectoryDraft({ mode: DirModeEnum.newDir, segments: [], inputPath: path })).toEqual({ ok: false, error, field: 'inputPath' })
  })

  it('展示用单个首尾斜杠规范化；仓库选择不接受含分隔符的伪分段', () => {
    expect(validateDirectoryDraft({ mode: DirModeEnum.newDir, segments: [], inputPath: ' /albums/2026/ ' })).toMatchObject({ ok: true, value: { selectedDir: 'albums/2026' } })
    expect(validateDirectoryDraft({ mode: DirModeEnum.repoDir, segments: ['a/b'], inputPath: '' })).toMatchObject({ ok: false, field: 'segments' })
  })

  it('预览、保存路径与 Contents API 的解码路径一致', () => {
    const config = { ...createRepositoryFixture(), selectedDir: '相 册.v1/图 #?', selectedDirList: ['相 册.v1', '图 #?'], dirMode: DirModeEnum.newDir }
    const image = createUploadImageObject()
    image.filename.final = 'photo #?.png'
    const url = uploadUrlHandle(config, image)
    expect(decodeURIComponent(url.split('/contents/')[1])).toBe(`${config.selectedDir}/${image.filename.final}`)
    expect(url).toContain('%23%3F')
    expect(displayDirectory(config.selectedDir)).toBe('/相 册.v1/图 #?')
  })

  it('日期在新批次解析，既有批次跨午夜仍保持目标', () => {
    const config = { ...createRepositoryFixture(), dirMode: DirModeEnum.dateDir }
    const first = resolveUploadTarget(config, new Date(2026, 9, 16, 23, 59))
    config.selectedDir = 'changed'
    const second = resolveUploadTarget(config, new Date(2026, 9, 17, 0, 1))
    expect(first.dir).toBe('20261016')
    expect(second.dir).toBe('20261017')
    expect(Object.isFrozen(first)).toBe(true)
    expect(first).not.toHaveProperty('token')
  })
})

describe('目录草稿事务', () => {
  it('草稿与 Store 无共享数组，取消和关闭后保存无副作用', () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture(), { selectedDir: 'albums', selectedDirList: ['albums'], dirMode: DirModeEnum.repoDir })
    const initial = JSON.stringify(store.getUserConfigInfo)
    const hook = useUploadDirectory()
    hook.open()
    hook.draft.value.segments.push('draft-only')
    expect(JSON.stringify(store.getUserConfigInfo)).toBe(initial)
    hook.cancel()
    expect(hook.save().ok).toBe(false)
    expect(JSON.stringify(store.getUserConfigInfo)).toBe(initial)
    expect(localStorage.getItem(LS_CONFIG)).toBeNull()
  })

  it('保存先持久化，成功后一次发布，viewDir 与历史合法路径保持', () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture(), { viewDir: 'browsing' })
    const hook = useUploadDirectory()
    hook.open()
    hook.draft.value.mode = DirModeEnum.newDir
    hook.draft.value.inputPath = '  相 册.v1/a/b/c/d  '
    expect(hook.preview.value).toBe('/相 册.v1/a/b/c/d')
    const setItem = Storage.prototype.setItem
    const order: string[] = []
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      order.push(store.getUserConfigInfo.selectedDir)
      setItem.call(this, key, value)
    })
    expect(hook.save().ok).toBe(true)
    expect(order).toEqual(['/'])
    expect(store.getUserConfigInfo.selectedDir).toBe('相 册.v1/a/b/c/d')
    expect(store.getUserConfigInfo.viewDir).toBe('browsing')
    expect(hook.visible.value).toBe(false)
    store.USER_CONFIG_INFO_PERSIST()
    expect(store.getUserConfigInfo.selectedDir).toBe('相 册.v1/a/b/c/d')
    expect(JSON.parse(localStorage.getItem(LS_CONFIG) ?? '{}').selectedDir).toBe('相 册.v1/a/b/c/d')
  })

  it('存储失败保持弹窗草稿和旧配置，重试成功', () => {
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture())
    store.USER_CONFIG_INFO_PERSIST()
    const initial = localStorage.getItem(LS_CONFIG)
    const hook = useUploadDirectory()
    hook.open()
    hook.draft.value.mode = DirModeEnum.newDir
    hook.draft.value.inputPath = ' albums/new '
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('storage unavailable')
    })
    expect(hook.save()).toEqual({ ok: false, reason: 'storage-unavailable' })
    expect(hook.visible.value).toBe(true)
    expect(hook.draft.value.inputPath).toBe('albums/new')
    expect(hook.preview.value).toBe('/albums/new')
    expect(localStorage.getItem(LS_CONFIG)).toBe(initial)
    expect(store.getUserConfigInfo.selectedDir).toBe('/')
    expect(hook.save().ok).toBe(true)
  })

  it('上传锁和非法值阻止提交，恢复后仍可保存', () => {
    const store = usePicxStore(pinia)
    const hook = useUploadDirectory()
    hook.open()
    store.uploadTargetBusy = true
    expect(hook.save()).toEqual({ ok: false, reason: 'upload-busy' })
    store.uploadTargetBusy = false
    hook.draft.value.mode = DirModeEnum.newDir
    hook.draft.value.inputPath = 'a/b/c/d/e/f'
    expect(hook.save()).toEqual({ ok: false, reason: 'invalid-path', field: 'inputPath' })
    expect(localStorage.getItem(LS_CONFIG)).toBeNull()
    expect(store.SAVE_UPLOAD_DIRECTORY({ dirMode: DirModeEnum.repoDir, selectedDir: 'a', selectedDirList: ['b'] }).ok).toBe(false)
  })

  it('日期草稿在打开和保存时重新解析午夜后的日期', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 23, 59))
    const store = usePicxStore(pinia)
    Object.assign(store.getUserConfigInfo, createRepositoryFixture(), { dirMode: DirModeEnum.dateDir, selectedDir: '20261015' })
    const hook = useUploadDirectory()
    hook.open()
    expect(hook.preview.value).toBe('/20261016')
    vi.setSystemTime(new Date(2026, 9, 17, 0, 1))
    expect(hook.save()).toMatchObject({ ok: true, value: { selectedDir: '20261017' } })
    expect(store.getUserConfigInfo.selectedDir).toBe('20261017')
    expect(directoryDraft(store.getUserConfigInfo).segments).toEqual(['20261017'])
  })
})
