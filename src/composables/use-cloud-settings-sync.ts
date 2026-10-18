import type { RepositoryIdentity } from '@/common/model/github-connection'
import type { ApiFailure } from '@/utils/request/types'
import { onScopeDispose, watch } from 'vue'
import { getCloudSettings, saveCloudSettingsResult } from '@/common/api/settings'
import { pinia } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { clearSettingsSync, registerCloudSettingsRetry, settingsRevision, settingsSyncState } from '@/stores/settings-sync-state'
import { projectSettings } from '@/utils/settings-payload'

const PUSH_DEBOUNCE_MS = 700
let active = false
/** 只在 AppWrap 启动；展示组件读取共享状态，不启动同步。 */
export function useCloudSettingsSync() {
  if (active)
    return
  active = true
  const store = usePicxStore(pinia)
  let epoch = 0
  let pulling = false
  let pushing = false
  let hasBaseline = false
  let syncedSnapshot: string | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const target = (): RepositoryIdentity | null => {
    const { owner, repo, branch, logined } = store.getUserConfigInfo
    return logined && owner && repo && branch ? { owner, repo, branch } : null
  }
  const key = () => {
    const value = target()
    return value ? `${value.owner}/${value.repo}/${value.branch}:${store.connectionAttemptId}` : ''
  }
  const snapshot = () => JSON.stringify(projectSettings(store.getUserSettings))
  let lastCloudError: ApiFailure | undefined
  const cloudFailed = (error = lastCloudError) => {
    lastCloudError = error
    if (settingsSyncState.value.phase === 'failed' && settingsSyncState.value.scope === 'local')
      return
    settingsSyncState.value = { phase: 'failed', scope: 'cloud', revision: settingsRevision.value, retryable: true, ...(error ? { error } : {}) }
  }
  async function pushNow() {
    clearTimeout(timer)
    timer = undefined
    const destination = target()
    if (!destination || pulling || pushing || !hasBaseline)
      return
    if (navigator.onLine === false) {
      cloudFailed({ kind: 'offline', retryable: true })
      return
    }
    const payload = projectSettings(store.getUserSettings)
    const serialized = JSON.stringify(payload)
    if (serialized === syncedSnapshot)
      return
    const revision = settingsRevision.value
    const id = epoch
    const origin = key()
    const current = () => id === epoch && origin === key()
    pushing = true
    settingsSyncState.value = { phase: 'syncing', revision }
    let success = false
    try {
      const result = await saveCloudSettingsResult(payload, destination, current)
      if (!current())
        return
      success = result.ok
      if (result.ok) {
        syncedSnapshot = serialized
        if (revision === settingsRevision.value && snapshot() === serialized)
          settingsSyncState.value = { phase: 'synced', revision, syncedAt: Date.now() }
      }
      else {
        cloudFailed(result.error)
      }
    }
    catch {
      if (current())
        cloudFailed()
    }
    finally {
      if (current())
        pushing = false
    }
    if (current() && success && snapshot() !== serialized)
      await pushNow()
  }
  async function pull(applyRemote: boolean) {
    const destination = target()
    if (!destination || pulling || pushing)
      return
    const id = epoch
    const origin = key()
    const current = () => id === epoch && origin === key()
    const revision = settingsRevision.value
    pulling = true
    settingsSyncState.value = { phase: 'syncing', revision }
    try {
      const result = await getCloudSettings(destination)
      if (!current())
        return
      if (!result.ok) {
        hasBaseline = false
        cloudFailed(result.error)
        return
      }
      hasBaseline = true
      if (result.data.kind === 'present' && applyRemote && revision === settingsRevision.value) {
        if (!store.SET_USER_SETTINGS(result.data.settings))
          return
        syncedSnapshot = snapshot()
        settingsSyncState.value = { phase: 'synced', revision: settingsRevision.value, syncedAt: Date.now() }
      }
      else {
        syncedSnapshot = null
      }
    }
    catch {
      if (current()) {
        hasBaseline = false
        cloudFailed()
      }
    }
    finally {
      if (current())
        pulling = false
    }
    if (current() && hasBaseline && syncedSnapshot === null)
      await pushNow()
  }
  async function retry() {
    if (!target())
      return
    if (!hasBaseline)
      await pull(false)
    else await pushNow()
  }
  const stopConnection = watch(key, () => {
    epoch += 1
    clearTimeout(timer)
    timer = undefined
    pulling = false
    pushing = false
    hasBaseline = false
    syncedSnapshot = null
    clearSettingsSync()
    lastCloudError = undefined
    if (target())
      void pull(true)
  }, { immediate: true, flush: 'sync' })
  const stopRevision = watch(settingsRevision, () => {
    if (!target() || pulling || snapshot() === syncedSnapshot)
      return
    if (!hasBaseline) {
      cloudFailed()
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => void pushNow(), PUSH_DEBOUNCE_MS)
  })
  function visibility() {
    if (document.visibilityState === 'hidden')
      void pushNow()
  }
  function flush() {
    void pushNow()
  }
  function online() {
    void retry()
  }
  registerCloudSettingsRetry(retry)
  window.addEventListener('pagehide', flush)
  window.addEventListener('online', online)
  document.addEventListener('visibilitychange', visibility)
  onScopeDispose(() => {
    active = false
    epoch += 1
    clearTimeout(timer)
    stopConnection()
    stopRevision()
    registerCloudSettingsRetry()
    window.removeEventListener('pagehide', flush)
    window.removeEventListener('online', online)
    document.removeEventListener('visibilitychange', visibility)
  })
}
