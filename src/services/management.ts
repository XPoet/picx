import type { GitTreeEntry } from '@/common/api/git-tree'
import type { UploadedImageModel } from '@/common/model'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ManagementBatchResult } from '@/common/model/management'
import type { ApiFailure, ApiResult } from '@/utils/request/types'
import { getRepoPathContentResult } from '@/common/api/dir'
import { deleteManagementFileResult, managementCommitResult, managementCommitTreeResult, managementEntryResult, managementTreeResult } from '@/common/api/management'
import { uploadHeadResult, uploadRefResult } from '@/common/api/upload-results'
import { store } from '@/stores'
import { purgeImageRuntimeCache } from '@/utils/image-cache-utils'
import { isValidManagementName } from '@/utils/management-utils'

const failure = (kind: ApiFailure['kind']): ApiResult<never> => ({ ok: false, error: { kind, retryable: kind !== 'conflict' } })
const snapshotRepository = ({ owner, repo, branch }: RepositoryIdentity): RepositoryIdentity => Object.freeze({ owner, repo, branch })
const currentRepository = (target: RepositoryIdentity) => {
  const config = store.getters.getUserConfigInfo
  return config.logined && config.owner === target.owner && config.repo === target.repo && config.branch === target.branch
}
function updateCache(target: RepositoryIdentity, action: () => void): boolean {
  if (!currentRepository(target))
    return false
  try {
    action()
    return false
  }
  catch {
    return true
  }
}

export async function deleteManagementMedia(repository: RepositoryIdentity, images: readonly UploadedImageModel[]): Promise<ManagementBatchResult> {
  const target = snapshotRepository(repository)
  const result: ManagementBatchResult = { successes: [], failures: [], cacheFailed: false }
  for (const image of images) {
    if (!currentRepository(target)) {
      result.failures.push({ path: image.path, sha: image.sha, error: { kind: 'unauthenticated', retryable: false } })
      continue
    }
    const response = await deleteManagementFileResult(target, image.path, image.sha)
    if (!response.ok) {
      result.failures.push({ path: image.path, sha: image.sha, error: response.error })
      continue
    }
    result.successes.push(image.path)
    result.cacheFailed = updateCache(target, () => {
      store.commit('DIR_IMAGE_LIST_REMOVE_CONFIRMED_MEDIA', image)
      purgeImageRuntimeCache([image.path])
    }) || result.cacheFailed
  }
  return result
}

async function commitPaths(target: RepositoryIdentity, entries: GitTreeEntry[], head: Awaited<ReturnType<typeof uploadHeadResult>> & { ok: true }, message: string): Promise<ApiResult<void>> {
  if (!currentRepository(target))
    return failure('unauthenticated')
  const tree = await managementCommitTreeResult(target, entries, head.data.commit.commit.tree.sha)
  if (!tree.ok)
    return tree
  if (!currentRepository(target))
    return failure('unauthenticated')
  const commit = await managementCommitResult(target, tree.data.sha, head.data.commit.sha, message)
  if (!commit.ok)
    return commit
  if (!currentRepository(target))
    return failure('unauthenticated')
  const ref = await uploadRefResult(target, commit.data.sha)
  return ref.ok ? { ok: true, data: undefined } : ref
}

export async function relocateManagementMedia(repository: RepositoryIdentity, image: UploadedImageModel, newDir: string, name = image.name): Promise<ApiResult<{ cacheFailed: boolean }>> {
  const target = snapshotRepository(repository)
  if (!currentRepository(target))
    return failure('unauthenticated')
  const path = newDir === '/' ? name : `${newDir}/${name}`
  if (path === image.path || !isValidManagementName(name))
    return failure('conflict')
  const destination = await managementEntryResult(target, path)
  if (destination.ok)
    return failure('conflict')
  if (destination.error.kind !== 'not-found')
    return destination
  const source = await managementEntryResult(target, image.path)
  if (!source.ok)
    return source
  if (Array.isArray(source.data) || source.data.sha !== image.sha)
    return failure('conflict')
  const head = await uploadHeadResult(target)
  if (!head.ok)
    return head
  const result = await commitPaths(target, [{ path, sha: image.sha }, { path: image.path, sha: null }], head, 'Move or rename media with PicX')
  if (!result.ok)
    return result
  const moved: UploadedImageModel = { ...image, dir: newDir, name, path, checked: false }
  const cacheFailed = updateCache(target, () => {
    store.commit('DIR_IMAGE_LIST_RELOCATE_MEDIA', { original: image, image: moved })
    purgeImageRuntimeCache([image.path, path])
  })
  return { ok: true, data: { cacheFailed } }
}

export async function changeManagementDirectory(repository: RepositoryIdentity, path: string, newName?: string): Promise<ApiResult<{ cacheFailed: boolean }>> {
  const target = snapshotRepository(repository)
  if (!currentRepository(target))
    return failure('unauthenticated')
  if (path === '/' || !path || (newName !== undefined && !isValidManagementName(newName)))
    return failure('conflict')
  const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
  const destination = newName === undefined ? null : `${parent ? `${parent}/` : ''}${newName}`
  if (destination) {
    const exists = await managementEntryResult(target, destination)
    if (exists.ok)
      return failure('conflict')
    if (exists.error.kind !== 'not-found')
      return exists
  }
  const head = await uploadHeadResult(target)
  if (!head.ok)
    return head
  const tree = await managementTreeResult(target, head.data.commit.commit.tree.sha)
  if (!tree.ok)
    return tree
  const blobs: Array<{ path: string, mode: string, sha: string }> = []
  if (!tree.data.truncated) {
    blobs.push(...tree.data.tree.filter(item => item.type === 'blob' && item.path.startsWith(`${path}/`)))
  }
  else {
    const collect = async (directory: string): Promise<ApiResult<void>> => {
      const content = await getRepoPathContentResult({ ...target, branch: head.data.commit.sha }, directory)
      if (!content.ok)
        return content
      for (const item of content.data) {
        if (item.type === 'dir') {
          const nested = await collect(item.path)
          if (!nested.ok)
            return nested
        }
        else if (item.type === 'file') {
          blobs.push({ path: item.path, mode: '100644', sha: item.sha })
        }
        else {
          return failure('invalid-response')
        }
      }
      return { ok: true, data: undefined }
    }
    const collected = await collect(path)
    if (!collected.ok)
      return collected
  }
  if (!blobs.length)
    return failure('not-found')
  const entries = blobs.flatMap<GitTreeEntry>(blob => destination
    ? [{ path: `${destination}${blob.path.slice(path.length)}`, mode: blob.mode, sha: blob.sha }, { path: blob.path, sha: null }]
    : [{ path: blob.path, sha: null }])
  const result = await commitPaths(target, entries, head, destination ? 'Rename directory with PicX' : 'Delete directory with PicX')
  if (!result.ok)
    return result
  const cacheFailed = updateCache(target, () => {
    store.commit(destination ? 'DIR_IMAGE_LIST_RENAME_DIR' : 'DIR_IMAGE_LIST_REMOVE_DIR_TREE', destination ? { oldDirPath: path, newDirName: newName } : path)
    purgeImageRuntimeCache(blobs.flatMap(blob => destination ? [blob.path, `${destination}${blob.path.slice(path.length)}`] : [blob.path]))
  })
  return { ok: true, data: { cacheFailed } }
}
