import { computed } from 'vue'
import axios from 'axios'
import { store } from '@/stores'
import { GITHUB_AUTHORIZE_EXPIRE } from '@/common/constant'
import router from '@/router'
import i18n from '@/plugins/vue/i18n'

const redirect_uri = import.meta!.env.VITE_REDIRECT_URI
const authorize_api = 'https://apis.xpoet.cn/api/github-authorize'

/**
 * 判断授权获取的 Token 是否已过期
 */
export const isAuthorizeExpire = () => {
  const { tokenCreateTime } = computed(() => store.getters.getGitHubAuthorizationInfo).value
  return Date.now() - tokenCreateTime > GITHUB_AUTHORIZE_EXPIRE
}

/**
 * GitHub APP 授权获取 Token
 */
export const githubAppAuthorize = () => {
  const authorize_uri = import.meta!.env.VITE_AUTHORIZE_URI
  const client_id = import.meta!.env.VITE_CLIENT_ID
  window.location.href = `${authorize_uri}?client_id=${client_id}&redirect_uri=${redirect_uri}`
}

/**
 * GitHub APP 授权回调处理
 */
export const githubAppAuthorizeCallback = async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const setup_action = params.get('setup_action')
  const installation_id = params.get('installation_id')

  // GitHub APP 安装之后的回调处理
  if (setup_action === 'install' && installation_id && !code) {
    await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
      installed: true,
      installationId: installation_id
    })

    ElMessageBox.confirm(i18n.global.t('authorization.msg_3'), i18n.global.t('tip'), {
      confirmButtonText: i18n.global.t('confirm'),
      cancelButtonText: i18n.global.t('cancel'),
      type: 'success',
      draggable: true
    })
      .then(() => {
        githubAppAuthorize()
      })
      .catch(() => {
        window.location.href = '/'
      })
  }

  // GitHub APP 授权之后的回调处理
  if (code) {
    const loading = ElLoading.service({
      lock: true,
      text: i18n.global.t('authorization.loading_1')
    })

    try {
      // 存储 code 状态信息
      await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
        authorized: true,
        code,
        codeCreateTime: Date.now(),
        isAutoAuthorize: true
      })

      const { token } = computed(() => store.getters.getGitHubAuthorizationInfo).value

      let newToken: string = ''

      if (!token || (token && isAuthorizeExpire())) {
        // 在服务端获取 Token
        const res = await axios.get(`${authorize_api}?code=${code}&redirect_uri=${redirect_uri}`)

        if (res.data?.data) {
          newToken = res.data.data
          // 存储授权 Token 信息
          await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
            token: newToken,
            tokenCreateTime: Date.now()
          })
        } else {
          ElMessage.error({ message: res.data.msg, duration: 6000 })
        }
      } else {
        newToken = token
      }

      if (newToken) {
        // 存储 Token
        await store.dispatch('SET_USER_CONFIG_INFO', {
          token: newToken
        })

        loading.close()

        // 跳转到图床配置页面，进行一键自动配置
        const oriUrl = window.location.href.replace(window.location.search, '')
        window.location.href = `${oriUrl}config?auto=1`
      }

      loading.close()
    } catch (e: any) {
      loading.close()
      ElMessage.error({ message: i18n.global.t('authorization.msg_4'), duration: 6000 })
    }
  }
}

/**
 * GitHub APP 授权的初始处理流程
 */
export const initGithubAuthorize = async () => {
  const { authorized, installed, token, isAutoAuthorize } = computed(
    () => store.getters.getGitHubAuthorizationInfo
  ).value

  const goLoginPage = async (cb?: any) => {
    router.push({ path: '/login', query: { jump: '0' } }).then(() => {
      // eslint-disable-next-line no-unused-expressions
      cb && cb()
    })
  }

  if (isAutoAuthorize && authorized && installed) {
    if (token && isAuthorizeExpire()) {
      const msgInstance = ElMessage.error({
        customClass: 'custom-message-container',
        duration: 0,
        showClose: true,
        message: `<div class="content-box authorization">
                    <span class="msg">${i18n.global.t('authorization.msg_1')}</span>
                    <spna class="btn-box">
                      <span class="confirm btn">${i18n.global.t('authorization.text_13')}</span>
                    </spna>
                  </div>`,
        dangerouslyUseHTMLString: true,
        onClose: () => {
          goLoginPage()
        }
      })

      document
        .querySelector('.custom-message-container .authorization .confirm')
        ?.addEventListener('click', () => {
          msgInstance.close()
          goLoginPage(() => {
            store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
              authorizing: true
            })
          })
        })

      await goLoginPage()
    }
  }
}
