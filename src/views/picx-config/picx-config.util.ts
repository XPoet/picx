import { computed } from 'vue'
import { store } from '@/stores'
import { DirModeEnum } from '@/common/model'
import {
  createRepo,
  getDirInfoList,
  getGitHubUserInfo,
  getRepoInfo,
  initRepoREADME
} from '@/common/api'
import { INIT_REPO_BARNCH, INIT_REPO_NAME } from '@/common/constant'
import router from '@/router'
import i18n from '@/plugins/vue/i18n'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

/**
 * 持久化用户图床配置信息
 */
export const persistUserConfigInfo = async () => {
  await store.dispatch('USER_CONFIG_INFO_PERSIST')
}

/**
 * 保存用户信息
 * @param userInfo
 */
export async function saveUserInfo(userInfo: any) {
  await store.dispatch('SET_USER_CONFIG_INFO', {
    logined: true,
    id: userInfo.id,
    owner: userInfo.login,
    name: userInfo.name,
    email: userInfo.email,
    avatarUrl: userInfo.avatar_url
  })
}

/**
 * 前往 [上传图片] 页面
 */
export const goUploadPage = async (inputRef: any) => {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = i18n.global.t('config_page.message_6')

  if (selectedDir === '') {
    // eslint-disable-next-line default-case
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = i18n.global.t('config_page.message_7')
        inputRef?.focus()
        break
      case DirModeEnum.repoDir:
        warningMessage = i18n.global.t('config_page.message_8')
        break
    }
    ElMessage.warning({ message: warningMessage })
  } else {
    await router.push('/upload')
  }
}

/**
 * PicX GitHub APP 安装状态处理
 * @param repoInfo
 * @param authorized
 * @param token
 */
export const installedStatusHandle = async (repoInfo: any, authorized: boolean, token: string) => {
  if (authorized && token) {
    if (repoInfo) {
      await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
        installed: true
      })
    } else {
      const msgInstance = ElMessage({
        customClass: 'custom-message-container',
        duration: 0,
        offset: 20,
        type: 'warning',
        message: `<div class="content-box authorization">
                    <span class="msg">${i18n.global.t('authorization.msg_2')}</span>
                    <spna class="btn-box">
                      <span class="confirm btn">${i18n.global.t('authorization.btn_1')}</span>
                    </spna>
                  </div>`,
        dangerouslyUseHTMLString: true
      })

      document
        .querySelector('.custom-message-container .authorization .confirm')
        ?.addEventListener('click', () => {
          msgInstance.close()
          let url = import.meta.env.VITE_INSTALL_URL as string
          if (userConfigInfo.id) {
            url = import.meta.env.VITE_INSTALL_URL_USER + userConfigInfo.id
          }
          window.location.href = url
        })
    }
  }
}

/**
 * 一键自动配置图床
 */
export const oneClickAutoConfig = async (tokenInput: any) => {
  const { token } = userConfigInfo

  if (!token) {
    ElMessage.error({ message: i18n.global.t('config_page.message_1') })
    tokenInput?.focus()
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: i18n.global.t('config_page.loading_6')
  })

  try {
    // 获取用户信息
    const userInfo = await getGitHubUserInfo(userConfigInfo.token)
    console.log('getGitHubUserInfo >> ', userInfo)

    if (!userInfo) {
      loading.close()
      ElMessage.error({ message: i18n.global.t('config_page.message_2') })
      return
    }

    // 保存 Token 到授权信息 store
    if (!store.getters.getGitHubAuthorizationInfo.isAutoAuthorize) {
      await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
        manualToken: userConfigInfo.token
      })
    }

    // 保存用户信息
    await saveUserInfo(userInfo)

    // 判断是否已存在 PicX 图床仓库
    let isExistInitRepo: boolean = false
    const initRepoInfo = await getRepoInfo(userConfigInfo.owner, INIT_REPO_NAME)
    console.log('initRepoInfo : ', initRepoInfo)
    if (initRepoInfo) {
      isExistInitRepo = true
      await store.dispatch('SET_USER_CONFIG_INFO', {
        repoPrivate: initRepoInfo.private
      })
    }

    const repoInfo = await createRepo(userConfigInfo.token)
    console.log('createRepo >> ', repoInfo)

    // ---- PicX GitHub APP 安装状态处理
    const authorizationInfo = computed(() => store.getters.getGitHubAuthorizationInfo).value
    const { token, authorized } = authorizationInfo
    await installedStatusHandle(repoInfo, authorized, token)
    if (!repoInfo) {
      loading.close()
      if (!(authorized && token)) {
        ElMessage.error({ message: i18n.global.t('config_page.message_3') })
      }
      return
    }
    // --------------------------------

    userConfigInfo.repo = INIT_REPO_NAME
    userConfigInfo.branch = INIT_REPO_BARNCH

    // 获取目录列表
    if (isExistInitRepo) {
      userConfigInfo.dirList = await getDirInfoList(userConfigInfo)
    }

    userConfigInfo.dirMode = DirModeEnum.rootDir
    userConfigInfo.selectedDir = '/'

    if (!isExistInitRepo) {
      await initRepoREADME(userConfigInfo)
    }
    // 持久化存储用户配置信息
    await persistUserConfigInfo()
    loading.close()
    ElMessage.success({ message: i18n.global.t('config_page.message_4') })
    await router.push('/upload')
  } catch (err) {
    ElMessage.error({ message: i18n.global.t('config_page.message_5') })
    console.error('oneClickAutoConfig >> ', err)
  }
}
