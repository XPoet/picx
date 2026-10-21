import { DirModeEnum } from '@/common/model'
import { useGithubConnection } from '@/composables/use-github-connection'
import i18n from '@/plugins/vue/i18n'
import router from '@/router'
import { store } from '@/stores'

interface Focusable { focus: () => void }

export async function persistUserConfigInfo() {
  await store.dispatch('USER_CONFIG_INFO_PERSIST')
}

export async function goUploadPage(inputRef?: Focusable | null) {
  const config = store.getters.getUserConfigInfo
  if (!config.selectedDir) {
    ElMessage.warning({ message: i18n.global.t(config.dirMode === DirModeEnum.newDir ? 'config_page.message_7' : 'config_page.message_8') })
    inputRef?.focus()
    return
  }
  await router.push('/upload')
}

/** 迁移期旧页面仍可调用同一连接服务；T015 后不再路由渲染。 */
export async function oneClickAutoConfig(tokenInput?: Focusable | null) {
  const connection = useGithubConnection()
  const token = store.getters.getUserConfigInfo.token
  if (!token) {
    tokenInput?.focus()
  }
  const ok = await connection.connect(token, store.getters.getGitHubAuthorizationInfo.isAutoAuthorize ? 'oauth' : 'token')
  if (ok) {
    await router.push('/upload')
  }
  else if (connection.connection.value.phase === 'failed') {
    const kind = connection.connection.value.error.kind
    const key = kind === 'app-not-installed'
      ? 'authorization.msg_2'
      : kind === 'initialization-failed' || kind === 'storage-unavailable' ? 'config_page.message_5' : `request_error.${kind}`
    ElMessage.error({ message: i18n.global.t(key) })
  }
}
