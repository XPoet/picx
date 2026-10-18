import type { UploadedImageModel } from '@/common/model'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRepoPathContentResult } from '@/common/api/dir'
import { deleteManagementFileResult, managementCommitResult, managementCommitTreeResult, managementEntryResult, managementTreeResult } from '@/common/api/management'
import { uploadHeadResult, uploadRefResult } from '@/common/api/upload-results'
import { changeManagementDirectory, deleteManagementMedia, relocateManagementMedia } from '@/services/management'
import { refreshManagementDirectory } from '@/services/repository-content'
import { store } from '@/stores'
import { getDirContent } from '@/stores/modules/dir-image-list/utils'

vi.mock('@/common/api/management', () => ({ deleteManagementFileResult: vi.fn(), managementCommitResult: vi.fn(), managementCommitTreeResult: vi.fn(), managementEntryResult: vi.fn(), managementTreeResult: vi.fn() }))
vi.mock('@/common/api/upload-results', async original => ({ ...await original<typeof import('@/common/api/upload-results')>(), uploadHeadResult: vi.fn(), uploadRefResult: vi.fn() }))
vi.mock('@/common/api/dir', async original => ({ ...await original<typeof import('@/common/api/dir')>(), getRepoPathContentResult: vi.fn() }))

const target = { owner: 'fixture-owner', repo: 'fixture-repo', branch: 'custom-branch' }
const item = (name: string, dir = '/'): UploadedImageModel => ({ type: 'image', name, dir, path: dir === '/' ? name : `${dir}/${name}`, sha: `sha-${name}`, uuid: `uuid-${name}`, checked: false, deleting: false, size: 200 })
const head = { ok: true as const, data: { commit: { sha: 'head', commit: { tree: { sha: 'base-tree' } } } } }
const failed = { ok: false as const, error: { kind: 'forbidden' as const, retryable: false } }

beforeEach(async () => {
  vi.resetAllMocks()
  localStorage.clear()
  await store.dispatch('DIR_IMAGE_LOGOUT')
  await store.dispatch('SET_USER_CONFIG_INFO', { ...target, logined: true, selectedDir: 'uploads', viewDir: '/', selectedDirList: ['uploads'] })
  vi.mocked(uploadHeadResult).mockResolvedValue(head)
  vi.mocked(managementCommitTreeResult).mockResolvedValue({ ok: true, data: { sha: 'tree' } })
  vi.mocked(managementCommitResult).mockResolvedValue({ ok: true, data: { sha: 'commit' } })
  vi.mocked(uploadRefResult).mockResolvedValue({ ok: true, data: { object: { sha: 'commit' } } })
})

describe('管理远端提交与本地缓存', () => {
  it('部分删除仅移除已确认项，失败保留且上传目标不变', async () => {
    const images = [item('a.png'), item('b.png')]
    for (const image of images) await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', image)
    vi.mocked(deleteManagementFileResult).mockResolvedValueOnce({ ok: true, data: { commit: { sha: 'deleted-a' } } }).mockResolvedValueOnce(failed)
    const result = await deleteManagementMedia(target, images)
    expect(result.successes).toEqual(['a.png'])
    expect(result.failures).toEqual([{ path: 'b.png', sha: 'sha-b.png', error: failed.error }])
    expect(store.getters.getDirObject.imageList.map(image => image.path)).toEqual(['b.png'])
    expect(store.getters.getUserConfigInfo.selectedDir).toBe('uploads')
    expect(deleteManagementFileResult).toHaveBeenNthCalledWith(2, target, 'b.png', 'sha-b.png')
  })

  it('移动 ref 失败不更改源与目标，成功后同次提交更新两条路径', async () => {
    const image = item('a.png')
    await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', image)
    vi.mocked(managementEntryResult).mockResolvedValueOnce({ ok: false, error: { kind: 'not-found', retryable: false } }).mockResolvedValueOnce({ ok: true, data: { path: 'a.png', sha: image.sha, type: 'file' } })
    vi.mocked(uploadRefResult).mockResolvedValueOnce(failed)
    expect((await relocateManagementMedia(target, image, 'albums')).ok).toBe(false)
    expect(store.getters.getDirObject.imageList[0].path).toBe('a.png')
    expect(getDirContent('albums', store.getters.getDirObject)).toBeNull()
    expect(managementCommitTreeResult).toHaveBeenCalledWith(target, [{ path: 'albums/a.png', sha: image.sha }, { path: 'a.png', sha: null }], 'base-tree')
    vi.mocked(managementEntryResult).mockResolvedValueOnce({ ok: false, error: { kind: 'not-found', retryable: false } }).mockResolvedValueOnce({ ok: true, data: { path: 'a.png', sha: image.sha, type: 'file' } })
    expect((await relocateManagementMedia(target, image, 'albums')).ok).toBe(true)
    expect(getDirContent('albums', store.getters.getDirObject)?.imageList[0].path).toBe('albums/a.png')
    expect(store.getters.getDirObject.imageList).toEqual([])
    expect(store.getters.getUserConfigInfo.selectedDir).toBe('uploads')
  })

  it('目标冲突或源 SHA 变化都不创建 tree', async () => {
    vi.mocked(managementEntryResult).mockResolvedValueOnce({ ok: true, data: [] })
    expect(await relocateManagementMedia(target, item('a.png'), 'albums')).toMatchObject({ ok: false, error: { kind: 'conflict' } })
    vi.mocked(managementEntryResult).mockResolvedValueOnce({ ok: false, error: { kind: 'not-found', retryable: false } }).mockResolvedValueOnce({ ok: true, data: { path: 'a.png', sha: 'changed', type: 'file' } })
    expect(await relocateManagementMedia(target, item('a.png'), 'albums')).toMatchObject({ ok: false, error: { kind: 'conflict' } })
    expect(managementCommitTreeResult).not.toHaveBeenCalled()
  })

  it('旧调用方传入响应式配置时仍冻结仓库身份，切仓库不继续提交 ref', async () => {
    const image = item('a.png')
    vi.mocked(managementEntryResult).mockResolvedValueOnce({ ok: false, error: { kind: 'not-found', retryable: false } }).mockResolvedValueOnce({ ok: true, data: { path: 'a.png', sha: image.sha, type: 'file' } })
    vi.mocked(managementCommitTreeResult).mockImplementation(async () => {
      await store.dispatch('SET_USER_CONFIG_INFO', { repo: 'other-repository' })
      return { ok: true, data: { sha: 'tree' } }
    })
    expect(await relocateManagementMedia(store.getters.getUserConfigInfo, image, 'albums')).toMatchObject({ ok: false, error: { kind: 'unauthenticated' } })
    expect(managementCommitResult).not.toHaveBeenCalled()
    expect(uploadRefResult).not.toHaveBeenCalled()
  })

  it('嵌套目录重命名保留父级；截断 tree 使用固定 commit 递归收集非媒体文件', async () => {
    await store.dispatch('DIR_IMAGE_LIST_ADD_DIR', 'albums/old')
    await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item('a.png', 'albums/old'))
    vi.mocked(managementEntryResult).mockResolvedValue({ ok: false, error: { kind: 'not-found', retryable: false } })
    vi.mocked(managementTreeResult).mockResolvedValue({ ok: true, data: { sha: 'base-tree', truncated: true, tree: [] } })
    vi.mocked(getRepoPathContentResult).mockResolvedValue({ ok: true, data: [{ type: 'file', path: 'albums/old/a.png', name: 'a.png', sha: 'sha-a.png', size: 200 }, { type: 'file', path: 'albums/old/readme.txt', name: 'readme.txt', sha: 'readme', size: 5 }] })
    expect((await changeManagementDirectory(target, 'albums/old', 'renamed')).ok).toBe(true)
    expect(getRepoPathContentResult).toHaveBeenCalledWith({ ...target, branch: 'head' }, 'albums/old')
    expect(managementCommitTreeResult).toHaveBeenCalledWith(target, expect.arrayContaining([{ path: 'albums/renamed/a.png', mode: '100644', sha: 'sha-a.png' }, { path: 'albums/renamed/readme.txt', mode: '100644', sha: 'readme' }]), 'base-tree')
    expect(getDirContent('albums/renamed', store.getters.getDirObject)?.imageList[0].path).toBe('albums/renamed/a.png')
  })

  it('目录扫描或 ref 失败保留整棵缓存，不把部分扫描提交', async () => {
    await store.dispatch('DIR_IMAGE_LIST_ADD_DIR', 'albums')
    vi.mocked(managementTreeResult).mockResolvedValue({ ok: true, data: { sha: 'base-tree', truncated: true, tree: [] } })
    vi.mocked(getRepoPathContentResult).mockResolvedValue(failed)
    expect((await changeManagementDirectory(target, 'albums')).ok).toBe(false)
    expect(managementCommitTreeResult).not.toHaveBeenCalled()
    vi.mocked(managementTreeResult).mockResolvedValue({ ok: true, data: { sha: 'base-tree', truncated: false, tree: [{ path: 'albums/a.png', sha: 'a', mode: '100644', type: 'blob' }] } })
    vi.mocked(uploadRefResult).mockResolvedValue(failed)
    expect((await changeManagementDirectory(target, 'albums')).ok).toBe(false)
    expect(getDirContent('albums', store.getters.getDirObject)).not.toBeNull()
  })
})

describe('成功刷新与失败隔离', () => {
  it('失败保留旧内容，成功按真实身份保留已知时间并去掉已不存在项', async () => {
    await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', { ...item('a.png'), uploadTime: 100 })
    await store.dispatch('DIR_IMAGE_LIST_ADD_IMAGE', item('stale.png'))
    const previous = JSON.stringify(store.getters.getDirObject)
    vi.mocked(getRepoPathContentResult).mockResolvedValueOnce(failed)
    expect((await refreshManagementDirectory(target, '/')).ok).toBe(false)
    expect(JSON.stringify(store.getters.getDirObject)).toBe(previous)
    vi.mocked(getRepoPathContentResult).mockResolvedValueOnce({ ok: true, data: [{ type: 'file', path: 'a.png', name: 'a.png', sha: 'sha-a.png', size: 222 }] })
    await refreshManagementDirectory(target, '/')
    expect(store.getters.getDirObject.imageList).toMatchObject([{ path: 'a.png', size: 222, uploadTime: 100 }])
    vi.mocked(getRepoPathContentResult).mockResolvedValueOnce({ ok: true, data: [] })
    await refreshManagementDirectory(target, '/')
    expect(store.getters.getDirObject.imageList).toEqual([])
  })

  it('已失效查询和登出后的迟到成功不重建缓存', async () => {
    vi.mocked(getRepoPathContentResult).mockResolvedValue({ ok: true, data: [{ type: 'file', path: 'a.png', name: 'a.png', sha: 'a', size: 2 }] })
    await refreshManagementDirectory(target, '/', () => false)
    expect(store.getters.getDirObject.imageList).toEqual([])
    let complete: ((value: Awaited<ReturnType<typeof deleteManagementFileResult>>) => void) | undefined
    vi.mocked(deleteManagementFileResult).mockImplementation(() => new Promise((resolve) => {
      complete = resolve
    }))
    const pending = deleteManagementMedia(target, [item('a.png')])
    await store.dispatch('LOGOUT')
    complete?.({ ok: true, data: { commit: { sha: 'done' } } })
    await pending
    expect(localStorage.getItem('PICX_IH_MANAGEMENT')).toBeNull()
  })
})
