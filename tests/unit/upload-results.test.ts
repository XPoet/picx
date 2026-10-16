import type { ApiResult } from '@/utils/request/types'
import { createHash, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/common/api/upload-results'
import { DirModeEnum } from '@/common/model'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { createUploadImageObject } from '@/utils/image-utils'
import { uploadFilesToGitHub, uploadImagesToGitHub, uploadImageToGitHub } from '@/utils/upload-utils'
import { createRepositoryFixture } from '../fixtures/ui-redesign'

vi.mock('@/common/api/upload-results', () => ({ uploadBlobResult: vi.fn(), uploadCommitResult: vi.fn(), uploadContentResult: vi.fn(), uploadContentsResult: vi.fn(), uploadHeadResult: vi.fn(), uploadRefResult: vi.fn(), uploadTreeResult: vi.fn() }))
vi.mock('@/utils/image-cache-utils', () => ({ purgeImageRuntimeCache: vi.fn() }))
const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data })
const failure = { ok: false, error: { kind: 'network', retryable: true } } as const
const config = () => createRepositoryFixture()
function image(name = 'a.png', size = 7) {
  const item = createUploadImageObject()
  item.uuid = crypto.randomUUID()
  item.filename.final = name
  item.base64.originalBase64 = `data:image/png;base64,${btoa('x'.repeat(size))}`
  item.fileInfo.originalFile = new File(['x'.repeat(size)], name, { type: 'image/png' })
  return item
}
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  usePicxStore(pinia).$reset()
  Object.values(api).forEach(fn => vi.mocked(fn).mockReset())
  vi.mocked(api.uploadBlobResult).mockResolvedValue(ok({ sha: 'blob-sha' }))
  vi.mocked(api.uploadHeadResult).mockResolvedValue(ok({ commit: { sha: 'parent', commit: { tree: { sha: 'base-tree' } } } }))
  vi.mocked(api.uploadTreeResult).mockResolvedValue(ok({ sha: 'tree-sha' }))
  vi.mocked(api.uploadCommitResult).mockResolvedValue(ok({ sha: 'commit-sha' }))
  vi.mocked(api.uploadRefResult).mockResolvedValue(ok({ object: { sha: 'commit-sha' } }))
})
afterEach(() => vi.unstubAllGlobals())
function assertPartition(result: Awaited<ReturnType<typeof uploadFilesToGitHub>>) {
  const settled = [...result.successes, ...result.failures].map(item => item.uuid)
  expect(new Set(settled).size).toBe(settled.length)
  expect([...settled].sort()).toEqual([...result.attemptedUuids].sort())
}
describe('逐项结果与分支提交边界', () => {
  it('单图 contents 提交成功返回实际路径、体积与 commit，旧适配兼容', async () => {
    const first = image('a.png', 7)
    vi.mocked(api.uploadContentsResult).mockResolvedValue(ok({ content: { name: 'a.png', path: 'a.png', size: 7, sha: 'blob' }, commit: { sha: 'commit' } }))
    const result = await uploadFilesToGitHub(config(), [first])
    assertPartition(result)
    expect(result.successes[0]).toMatchObject({ uploadedBytes: 7, commitSha: 'commit', image: { path: 'a.png', size: 7, dir: '/' } })
    expect(first.uploadStatus).toEqual({ progress: 100, uploading: false })
    expect(api.uploadBlobResult).not.toHaveBeenCalled()
    expect(await uploadImageToGitHub(config(), image())).toBe(true)
  })
  it('全成功在 ref 完成前不发布任何成功或目录缓存，采用最终 File.size', async () => {
    const store = usePicxStore(pinia)
    const add = vi.spyOn(store, 'DIR_IMAGE_LIST_ADD_IMAGE')
    const files = [image('a.webp', 2), image('b.png', 11)]
    let complete: ((result: Awaited<ReturnType<typeof api.uploadRefResult>>) => void) | undefined
    vi.mocked(api.uploadRefResult).mockImplementation(() => new Promise(resolve => complete = resolve))
    const task = uploadFilesToGitHub(config(), files)
    await vi.waitFor(() => expect(complete).toBeTypeOf('function'))
    expect(files.map(file => file.uploadStatus.progress)).toEqual([0, 0])
    expect(add).not.toHaveBeenCalled()
    complete?.(ok({ object: { sha: 'commit-sha' } }))
    const result = await task
    assertPartition(result)
    expect(result.successes.map(item => item.uploadedBytes)).toEqual([2, 11])
    expect(add).toHaveBeenCalledTimes(2)
  })
  it('部分 blob 失败，只提交并发布成功项；布尔适配不误报全成功', async () => {
    vi.mocked(api.uploadBlobResult).mockResolvedValueOnce(failure).mockResolvedValueOnce(ok({ sha: 'b-blob' }))
    const files = [image('a.png'), image('b.png')]
    const result = await uploadFilesToGitHub(config(), files)
    assertPartition(result)
    expect(result.successes.map(item => item.uuid)).toEqual([files[1].uuid])
    expect(result.failures[0]).toMatchObject({ uuid: files[0].uuid, stage: 'blob' })
    expect(api.uploadTreeResult).toHaveBeenCalledWith(expect.any(Object), [{ path: 'b.png', sha: 'b-blob' }], expect.any(Object))
    vi.mocked(api.uploadBlobResult).mockResolvedValueOnce(failure).mockResolvedValueOnce(ok({ sha: 'b' }))
    expect(await uploadImagesToGitHub(config(), [image('c.png'), image('d.png')])).toBe(false)
  })
  it.each(['head', 'tree', 'commit', 'ref'] as const)('%s 失败没有 100%% 或成功缓存，所有上传标志收尾', async (stage) => {
    const method = { head: api.uploadHeadResult, tree: api.uploadTreeResult, commit: api.uploadCommitResult, ref: api.uploadRefResult }[stage]
    vi.mocked(method).mockResolvedValueOnce(failure)
    const add = vi.spyOn(usePicxStore(pinia), 'DIR_IMAGE_LIST_ADD_IMAGE')
    const files = [image('a.png'), image('b.png')]
    const result = await uploadFilesToGitHub(config(), files)
    assertPartition(result)
    expect(result.successes).toEqual([])
    expect(result.failures.map(item => item.stage)).toEqual([stage, stage])
    expect(files.map(file => file.uploadStatus)).toEqual([{ progress: 0, uploading: false }, { progress: 0, uploading: false }])
    expect(add).not.toHaveBeenCalled()
  })
  it('全部 blob 失败不提交空 tree；同路径不会静默合并覆盖', async () => {
    vi.mocked(api.uploadBlobResult).mockResolvedValue(failure)
    let result = await uploadFilesToGitHub(config(), [image('a.png'), image('b.png')])
    assertPartition(result)
    expect(api.uploadHeadResult).not.toHaveBeenCalled()
    result = await uploadFilesToGitHub(config(), [image('same.png'), image('same.png')])
    expect(result.failures.every(item => item.error.kind === 'conflict')).toBe(true)
    expect(api.uploadTreeResult).not.toHaveBeenCalled()
  })
  it('重复提交与已成功项不重复发请求，批次目标与名称不随配置变化', async () => {
    const settings = { ...config(), dirMode: DirModeEnum.dateDir }
    const files = [image('a.png'), image('b.png')]
    let continueBlob: ((value: Awaited<ReturnType<typeof api.uploadBlobResult>>) => void) | undefined
    vi.mocked(api.uploadBlobResult).mockImplementationOnce(() => new Promise(resolve => continueBlob = resolve))
    const task = uploadFilesToGitHub(settings, files, { now: new Date(2026, 9, 17, 23, 59) })
    const duplicate = await uploadFilesToGitHub(settings, files)
    expect(duplicate.attemptedUuids).toEqual([])
    settings.owner = 'changed'
    settings.selectedDir = 'elsewhere'
    files[0].filename.final = 'changed.png'
    continueBlob?.(ok({ sha: 'a' }))
    const result = await task
    expect(result.successes.map(item => item.image.path)).toEqual(['20261017/a.png', '20261017/b.png'])
    expect(result.target.owner).toBe('fixture-owner')
    expect(Object.isFrozen(result.target)).toBe(true)
    expect(result.target).not.toHaveProperty('token')
    expect((await uploadFilesToGitHub(config(), files)).attemptedUuids).toEqual([])
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(ok({ content: { name: 'next.png', path: '20261018/next.png', size: 7, sha: 'next' }, commit: { sha: 'next-commit' } }))
    expect((await uploadFilesToGitHub({ ...config(), dirMode: DirModeEnum.dateDir }, [image('next.png')], { now: new Date(2026, 9, 18, 0, 1) })).target.dir).toBe('20261018')
  })
  it('ref 结果未确认时先查询真实路径，匹配 blob 后恢复成功，不重复写入', async () => {
    const files = [image('a.png'), image('b.png')]
    vi.mocked(api.uploadRefResult).mockResolvedValueOnce(failure)
    await uploadFilesToGitHub(config(), files)
    vi.mocked(api.uploadContentResult).mockImplementation(async (_target, path) => ok({ name: path, path, size: 7, sha: 'blob-sha' }))
    const result = await uploadFilesToGitHub(config(), files)
    assertPartition(result)
    expect(result.successes.every(item => item.recovered)).toBe(true)
    expect(api.uploadBlobResult).toHaveBeenCalledTimes(2)
    expect(api.uploadRefResult).toHaveBeenCalledTimes(1)
  })
  it('重试查询遇到不同内容或权限失败不覆盖；旧管理重传缺 File 使用响应体积', async () => {
    const first = image()
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(failure)
    await uploadFilesToGitHub(config(), [first])
    vi.mocked(api.uploadContentResult).mockResolvedValueOnce({ ok: false, error: { kind: 'forbidden', retryable: false } })
    const retry = await uploadFilesToGitHub(config(), [first])
    expect(retry.failures[0].error.kind).toBe('forbidden')
    expect(api.uploadContentsResult).toHaveBeenCalledTimes(1)
    const legacy = image('renamed.png')
    legacy.fileInfo.originalFile = null
    legacy.reUploadInfo = { isReUpload: true, dir: 'albums', path: 'albums/renamed.png' }
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(ok({ content: { name: 'renamed.png', path: 'albums/renamed.png', sha: 'new', size: 123 }, commit: { sha: 'commit' } }))
    const result = await uploadFilesToGitHub(config(), [legacy])
    expect(result.successes[0]).toMatchObject({ target: { dir: 'albums' }, uploadedBytes: 123, image: { path: 'albums/renamed.png', size: 123 } })
  })
  it('缓存失败不反转已确认远端成功，失效任务不发布到队列', async () => {
    const file = image()
    vi.spyOn(usePicxStore(pinia), 'DIR_IMAGE_LIST_ADD_IMAGE').mockImplementationOnce(() => {
      throw new Error('fixture storage')
    })
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(ok({ content: { name: 'a.png', path: 'a.png', size: 7, sha: 'a' }, commit: { sha: 'commit' } }))
    expect((await uploadFilesToGitHub(config(), [file])).cacheFailed).toBe(true)
    expect(file.uploadStatus.progress).toBe(100)
    const stale = [image('c.png'), image('d.png')]
    const result = await uploadFilesToGitHub(config(), stale, { isCurrent: () => false })
    expect(result.successes).toEqual([])
    expect(stale.every(file => file.uploadStatus.progress === 0)).toBe(true)
  })
  it('单图结果未知后按真实 Git blob SHA 核验，内容不同不盲目覆盖', async () => {
    const first = image()
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(failure)
    await uploadFilesToGitHub(config(), [first])
    vi.mocked(api.uploadContentResult).mockResolvedValueOnce(ok({ name: 'a.png', path: 'a.png', size: 7, sha: 'different-content' }))
    const mismatch = await uploadFilesToGitHub(config(), [first])
    expect(mismatch.failures[0].error.kind).toBe('conflict')
    const sha = createHash('sha1').update('blob 7\0xxxxxxx').digest('hex')
    vi.mocked(api.uploadContentResult).mockResolvedValueOnce(ok({ name: 'a.png', path: 'a.png', size: 7, sha }))
    const recovered = await uploadFilesToGitHub(config(), [first])
    expect(recovered.successes[0]).toMatchObject({ recovered: true, commitSha: 'parent', uploadedBytes: 7 })
    expect(api.uploadContentsResult).toHaveBeenCalledTimes(1)
  })
  it('部分成功后重试只提交失败项，成功的 File 与结果不变', async () => {
    const files = [image('a.png'), image('b.png')]
    vi.mocked(api.uploadBlobResult).mockResolvedValueOnce(failure).mockResolvedValueOnce(ok({ sha: 'b' }))
    const first = await uploadFilesToGitHub(config(), files)
    const saved = files[1].uploadedImg
    vi.mocked(api.uploadContentsResult).mockResolvedValueOnce(ok({ content: { name: 'a.png', path: 'a.png', sha: 'a', size: 7 }, commit: { sha: 'retry' } }))
    const retry = await uploadFilesToGitHub(config(), files)
    expect(retry.attemptedUuids).toEqual([files[0].uuid])
    expect(retry.successes).toHaveLength(1)
    expect(files[1].uploadedImg).toBe(saved)
    expect(first.successes[0].image).toBe(saved)
    expect(api.uploadBlobResult).toHaveBeenCalledTimes(2)
  })
})
