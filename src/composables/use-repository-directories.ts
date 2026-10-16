import type { MaybeRefOrGetter } from 'vue'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { DirectoryQueryState, RepositoryDirectoryOption } from '@/common/model/repository-directory'
import { shallowRef, toValue, watch } from 'vue'
import { getDirInfoListResult } from '@/common/api/dir'
import { NEW_DIR_COUNT_MAX } from '@/common/constant'
import { DirModeEnum } from '@/common/model/user-config'
import { directoryQueryKey, validateDirectoryDraft } from '@/utils/directory-utils'

export function useRepositoryDirectories(repository: MaybeRefOrGetter<RepositoryIdentity | null>) {
  const loads = shallowRef<Record<string, DirectoryQueryState>>({})
  let session = 0
  let nextRequestId = 0

  function beginSession() {
    session += 1
    loads.value = {}
  }

  function endSession() {
    session += 1
  }

  async function loadChildren(parent: readonly string[], refresh = false) {
    if (parent.length >= NEW_DIR_COUNT_MAX)
      return
    const key = directoryQueryKey(parent)
    const previous = loads.value[key]
    if (previous?.phase === 'loading' || (!refresh && previous?.phase === 'loaded'))
      return
    const identity = toValue(repository)
    if (!identity) {
      loads.value = { ...loads.value, [key]: { phase: 'failed', error: { kind: 'unauthenticated', retryable: false } } }
      return
    }
    const snapshot = { ...identity }
    const currentSession = session
    const requestId = ++nextRequestId
    const items = previous && 'items' in previous ? previous.items : undefined
    loads.value = { ...loads.value, [key]: { phase: 'loading', requestId, items } }
    const result = await getDirInfoListResult(snapshot, parent.join('/'))
    const current = loads.value[key]
    const currentIdentity = toValue(repository)
    if (session !== currentSession || current?.phase !== 'loading' || current.requestId !== requestId
      || !currentIdentity || currentIdentity.owner !== snapshot.owner || currentIdentity.repo !== snapshot.repo || currentIdentity.branch !== snapshot.branch) {
      return
    }
    if (!result.ok) {
      loads.value = { ...loads.value, [key]: { phase: 'failed', error: result.error, items } }
      return
    }
    const options: RepositoryDirectoryOption[] = result.data.map(item => ({
      name: item.value,
      segments: [...parent, item.value],
      leaf: parent.length + 1 >= NEW_DIR_COUNT_MAX,
    }))
    if (options.some(option => !validateDirectoryDraft({ mode: DirModeEnum.repoDir, segments: [...option.segments], inputPath: '' }).ok)) {
      loads.value = { ...loads.value, [key]: { phase: 'failed', error: { kind: 'invalid-response', retryable: true }, items } }
      return
    }
    loads.value = { ...loads.value, [key]: { phase: 'loaded', items: options } }
  }

  watch(() => JSON.stringify(toValue(repository)), beginSession, { flush: 'sync' })

  return { loads, beginSession, endSession, loadChildren }
}
