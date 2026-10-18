import type { CustomAxiosRequestConfig } from '@/utils/request/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteManagementFileResult, managementCommitTreeResult, managementTreeResult } from '@/common/api/management'
import { requestResult } from '@/utils/request'

const state = vi.hoisted(() => ({ response: undefined as unknown }))
vi.mock('@/utils/request', () => ({ requestResult: vi.fn(async (_config: CustomAxiosRequestConfig, guard: (value: unknown) => boolean) => guard(state.response) ? { ok: true, data: state.response } : { ok: false, error: { kind: 'invalid-response', retryable: true } }) }))

beforeEach(() => vi.clearAllMocks())
const repository = { owner: 'owner', repo: 'repo', branch: 'feature/media' }

describe('管理 API 安全结果', () => {
  it('删除传递指定分支和源 SHA，路径逐段编码；不接受空 200 作为提交成功', async () => {
    state.response = { commit: { sha: 'confirmed' }, content: null }
    expect((await deleteManagementFileResult(repository, 'folder/a b.png', 'expected')).ok).toBe(true)
    expect(requestResult).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE', url: '/repos/owner/repo/contents/folder/a%20b.png', data: expect.objectContaining({ branch: 'feature/media', sha: 'expected' }) }), expect.any(Function))
    state.response = {}
    expect(await deleteManagementFileResult(repository, 'a.png', 'sha')).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
  })

  it('tree 保留 null 删除语义；递归扫描必须返回完整结构与截断标记', async () => {
    state.response = { sha: 'new-tree' }
    await managementCommitTreeResult(repository, [{ path: 'a.png', sha: null }], 'base')
    expect(requestResult).toHaveBeenCalledWith(expect.objectContaining({ data: { base_tree: 'base', tree: [{ path: 'a.png', sha: null, type: 'blob', mode: '100644' }] } }), expect.any(Function))
    state.response = { sha: 'base', truncated: true, tree: [] }
    expect((await managementTreeResult(repository, 'base')).ok).toBe(true)
    state.response = { sha: 'base', tree: [{ path: 'bad' }] }
    expect((await managementTreeResult(repository, 'base')).ok).toBe(false)
  })
})
