import { computed } from 'vue'
import { connectGitHub } from '@/services/github-connection'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'

let pending: { attemptId: number, promise: Promise<boolean> } | undefined

export function useGithubConnection() {
  const store = usePicxStore(pinia)
  const connection = computed(() => store.connection)
  const busy = computed(() => connection.value.phase === 'validating' || connection.value.phase === 'initializing')

  function connect(token: string, mode: 'token' | 'oauth' = 'token'): Promise<boolean> {
    if (pending?.attemptId === store.connectionAttemptId && busy.value) {
      return pending.promise
    }
    const attemptId = store.BEGIN_GITHUB_CONNECTION()
    const isCurrent = () => attemptId === store.connectionAttemptId
    const promise = (async () => {
      try {
        const result = await connectGitHub({ token, mode, previous: { owner: store.getUserConfigInfo.owner, repo: store.getUserConfigInfo.repo, branch: store.getUserConfigInfo.branch } }, (step) => {
          if (isCurrent()) {
            store.connection = { phase: 'initializing', attemptId, step }
          }
        }, isCurrent)
        if (!isCurrent()) {
          return false
        }
        if (!result.ok) {
          store.connection = { phase: 'failed', attemptId, error: result.error }
          return false
        }
        return store.COMMIT_GITHUB_CONNECTION(attemptId, token, mode, result.data)
      }
      catch {
        if (isCurrent()) {
          store.connection = { phase: 'failed', attemptId, error: { kind: 'storage-unavailable', retryable: true } }
        }
        return false
      }
      finally {
        if (pending?.attemptId === attemptId) {
          pending = undefined
        }
      }
    })()
    pending = { attemptId, promise }
    return promise
  }

  function restore() {
    const config = store.getUserConfigInfo
    if (!config.token) {
      return Promise.resolve(false)
    }
    return connect(config.token, store.getGitHubAuthorizationInfo.isAutoAuthorize ? 'oauth' : 'token')
  }

  return { connection, busy, connect, restore }
}
