import type { ConnectionFailure } from '@/common/model/github-connection'
import { exchangeAuthorizationCode } from '@/common/api/oauth'
import { GITHUB_AUTHORIZE_EXPIRE } from '@/common/constant'
import { useGithubConnection } from '@/composables/use-github-connection'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import { cleanAuthorizationURL, connectionLocation, connectionReturnTo, readAuthorizationCallback } from '@/utils/login-navigation'

export function isAuthorizeExpire() {
  return Date.now() - store.getters.getGitHubAuthorizationInfo.tokenCreateTime > GITHUB_AUTHORIZE_EXPIRE
}

export function githubAppAuthorize(returnTo: unknown = '/upload') {
  const url = new URL(import.meta.env.VITE_AUTHORIZE_URI)
  url.searchParams.set('client_id', import.meta.env.VITE_CLIENT_ID)
  url.searchParams.set('redirect_uri', import.meta.env.VITE_REDIRECT_URI)
  url.searchParams.set('state', connectionReturnTo(returnTo))
  window.location.assign(url.toString())
}

interface CallbackOutcome {
  handled: boolean
  connected: boolean
  returnTo: string
  installationReady?: boolean
}
let callbackPending: Promise<CallbackOutcome> | undefined

/** 局部消费并先清理 URL，任何失败只进入脱敏连接状态。 */
export function githubAppAuthorizeCallback(): Promise<CallbackOutcome> {
  if (callbackPending)
    return callbackPending
  const source = new URL(window.location.href)
  const callback = readAuthorizationCallback(source)
  if (!callback)
    return Promise.resolve({ handled: false, connected: false, returnTo: '/upload' })
  window.history.replaceState(window.history.state, '', cleanAuthorizationURL(source))
  const picx = usePicxStore(pinia)
  const attemptId = picx.BEGIN_GITHUB_CONNECTION()
  const fail = (error: ConnectionFailure) => {
    if (picx.connectionAttemptId === attemptId)
      picx.connection = { phase: 'failed', attemptId, error }
  }
  callbackPending = (async () => {
    await router.replace(connectionLocation(callback.returnTo))
    const outcome: CallbackOutcome = { handled: true, connected: false, returnTo: callback.returnTo }
    if (picx.connectionAttemptId !== attemptId)
      return outcome
    if (callback.kind === 'cancelled') {
      fail({ kind: 'oauth-cancelled', retryable: true })
      return outcome
    }
    if (callback.kind === 'installation') {
      try {
        await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', { installed: true, installationId: callback.installationId, code: '', codeCreateTime: 0 })
        picx.connection = { phase: 'disconnected' }
        return { ...outcome, installationReady: true }
      }
      catch {
        fail({ kind: 'storage-unavailable', retryable: true })
        return outcome
      }
    }
    const result = await exchangeAuthorizationCode(callback.code)
    if (picx.connectionAttemptId !== attemptId)
      return outcome
    if (!result.ok) {
      fail(result.error)
      return outcome
    }
    outcome.connected = await useGithubConnection().connect(result.data, 'oauth')
    return outcome
  })().finally(() => { callbackPending = undefined })
  return callbackPending
}

/** 客户端检查窗口仅引导重新验证，不将其当作服务端 Token 失效证明。 */
export async function initGithubAuthorize() {
  const auth = store.getters.getGitHubAuthorizationInfo
  if (callbackPending || readAuthorizationCallback(new URL(window.location.href)))
    return
  if (auth.isAutoAuthorize && auth.token && isAuthorizeExpire()) {
    ElMessage.warning({ message: i18n.global.t('connection.recheck_required') })
    await router.replace(connectionLocation(router.currentRoute.value.path))
  }
}
