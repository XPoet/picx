import type { ApiFailure } from '@/utils/request/types'
import { ref, shallowRef } from 'vue'

export type SettingsSyncState
  = | { phase: 'idle' }
    | { phase: 'saving-local' | 'local-saved' | 'syncing', revision: number }
    | { phase: 'synced', revision: number, syncedAt: number }
    | { phase: 'failed', revision: number, scope: 'local' | 'cloud', retryable: boolean, error?: ApiFailure }
export const settingsRevision = ref(0)
export const settingsSyncState = shallowRef<SettingsSyncState>({ phase: 'idle' })
let retryLocal: (() => boolean) | undefined
let retryCloud: (() => Promise<void>) | undefined
export function localSettingsSaved() {
  settingsRevision.value += 1
  retryLocal = undefined
  settingsSyncState.value = { phase: 'local-saved', revision: settingsRevision.value }
}
export function localSettingsFailed(retry: () => boolean) {
  retryLocal = retry
  settingsSyncState.value = { phase: 'failed', scope: 'local', revision: settingsRevision.value, retryable: true }
}
export function registerCloudSettingsRetry(handler?: () => Promise<void>) {
  retryCloud = handler
}
export function retrySettingsSync() {
  if (settingsSyncState.value.phase === 'failed' && settingsSyncState.value.scope === 'local')
    retryLocal?.()
  else void retryCloud?.()
}
export function clearSettingsSync() {
  retryLocal = undefined
  settingsSyncState.value = { phase: 'idle' }
}
