import type { DeploymentObservation, DeploymentRequest, DeploymentState } from '@/common/model/deployment'
import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiResult } from '@/utils/request/types'
import { computed, shallowRef } from 'vue'

interface DeploymentDependencies {
  target: () => RepositoryIdentity | null
  query: (target: RepositoryIdentity, sha?: string) => Promise<ApiResult<DeploymentObservation>>
  submit: (target: RepositoryIdentity, current: () => boolean, step: (value: 'cname' | 'branch' | 'pages') => void, request?: DeploymentRequest) => Promise<ApiResult<{ commitSha: string }> | null>
  pause?: () => Promise<void>
  pollLimit?: number
}
export function repositoryKey(target: RepositoryIdentity | null) {
  return target ? `${target.owner}/${target.repo}/${target.branch}` : ''
}
export function createDeploymentService(dependencies: DeploymentDependencies) {
  const state = shallowRef<DeploymentState>({ phase: 'idle' })
  const busy = shallowRef(false)
  let operationId = 0
  let pending: Promise<DeploymentState> | null = null
  function reset() {
    operationId += 1
    state.value = { phase: 'idle' }
    pending = null
    busy.value = false
  }
  function run(submit: boolean, request?: DeploymentRequest) {
    if (pending)
      return pending
    const target = dependencies.target()
    if (!target)
      return Promise.resolve(state.value)
    const id = ++operationId
    const current = () => id === operationId && repositoryKey(target) === repositoryKey(dependencies.target())
    const previous = state.value
    const expectedSha = previous.phase === 'waiting' && repositoryKey(previous.target) === repositoryKey(target) ? previous.commitSha : undefined
    busy.value = true
    state.value = { phase: 'checking', operationId: id, target }
    const task = async () => {
      let sha = expectedSha
      if (submit) {
        state.value = { phase: 'submitting', operationId: id, target, step: 'cname' }
        const result = await dependencies.submit(target, current, (step) => {
          if (current())
            state.value = { phase: 'submitting', operationId: id, target, step }
        }, request)
        if (!current())
          return state.value
        if (!result) {
          state.value = previous
          return state.value
        }
        if (!result.ok) {
          state.value = { phase: 'failed', operationId: id, target, error: result.error }
          return state.value
        }
        sha = result.data.commitSha
        state.value = { phase: 'waiting', operationId: id, target, commitSha: sha }
      }
      const limit = submit ? dependencies.pollLimit ?? 12 : 1
      for (let index = 0; index < limit; index += 1) {
        if (!current())
          return state.value
        const result = await dependencies.query(target, sha)
        if (!current())
          return state.value
        if (!result.ok) {
          state.value = { phase: 'failed', operationId: id, target, error: result.error }
          break
        }
        const observation = result.data
        if (observation.phase === 'not-deployed') {
          state.value = { phase: 'not-deployed', target, checkedAt: Date.now() }
          break
        }
        sha = observation.commitSha
        if (observation.phase === 'available') {
          state.value = { ...observation, operationId: id, target, evidence: 'pages-build', checkedAt: Date.now() }
          break
        }
        state.value = { phase: 'waiting', operationId: id, target, commitSha: sha }
        if (index < limit - 1)
          await (dependencies.pause?.() ?? new Promise<void>(resolve => setTimeout(resolve, 5000)))
      }
      return state.value
    }
    const promise = task().catch(() => {
      if (current())
        state.value = { phase: 'failed', operationId: id, target, error: { kind: 'network', retryable: true } }
      return state.value
    }).finally(() => {
      if (pending === promise) {
        pending = null
        busy.value = false
      }
    })
    pending = promise
    return promise
  }
  return { state, busy: computed(() => busy.value), check: () => run(false), deploy: (request?: DeploymentRequest) => run(true, request), reset }
}
