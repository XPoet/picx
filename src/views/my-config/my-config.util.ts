import { computed } from 'vue'
import { store } from '@/stores'
import {
  BranchModeEnum,
  DirModeEnum,
  ElementPlusSizeEnum,
  LanguageEnum,
  UserSettingsModel
} from '@/common/model'
import { createRepo, getGitHubUserInfo, initEmptyRepo } from '@/common/api'
import { INIT_REPO_BARNCH, INIT_REPO_NAME } from '@/common/constant'
import { formatDatetime } from '@/utils'
import router from '@/router'
import i18n from '@/plugins/vue/i18n'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

/**
 * 重置图床配置
 */
export const resetConfig = async () => {
  await store.dispatch('LOGOUT')
}

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
  userConfigInfo.logined = true
  userConfigInfo.id = userInfo.id
  userConfigInfo.owner = userInfo.login
  userConfigInfo.name = userInfo.name
  userConfigInfo.email = userInfo.email
  userConfigInfo.avatarUrl = userInfo.avatar_url
  await persistUserConfigInfo()
}

/**
 * 重新手动配置图床，清空之前的配置信息
 */
export const initReHandConfig = () => {
  userConfigInfo.selectedRepo = ''
  userConfigInfo.repoList = []
  userConfigInfo.selectedBranch = ''
  userConfigInfo.branchMode = BranchModeEnum.repoBranch
  userConfigInfo.branchList = []
  userConfigInfo.selectedDir = ''
  userConfigInfo.dirMode = DirModeEnum.repoDir
  userConfigInfo.dirList = []
}

/**
 * 前往 上传图片 页面
 */
export const goUploadPage = async () => {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = i18n.global.t('config.message6')

  if (selectedDir === '') {
    // eslint-disable-next-line default-case
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = i18n.global.t('config.message7')
        break
      case DirModeEnum.repoDir:
        warningMessage = i18n.global.t('config.message8', { repo: userConfigInfo.selectedRepo })
        break
    }
    ElMessage.warning({ message: warningMessage })
  } else {
    await router.push('/upload')
  }
}

/**
 * GitHub APP 安装状态处理
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
export const oneClickAutoConfig = async () => {
  const { token } = userConfigInfo

  if (!token) {
    ElMessage.error({ message: i18n.global.t('config.message1') })
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: i18n.global.t('config.loading6')
  })

  try {
    const userInfo = await getGitHubUserInfo(userConfigInfo.token)
    console.log('getGitHubUserInfo >> ', userInfo)

    if (!userInfo) {
      loading.close()
      ElMessage.error({ message: i18n.global.t('config.message2') })
      return
    }

    if (!store.getters.getGitHubAuthorizationInfo.isAutoAuthorize) {
      await store.dispatch('SET_GITHUB_AUTHORIZATION_INFO', {
        manualToken: userConfigInfo.token
      })
    }

    await saveUserInfo(userInfo)

    const repoInfo = await createRepo(userConfigInfo.token)
    console.log('createRepo >> ', repoInfo)

    const authorizationInfo = computed(() => store.getters.getGitHubAuthorizationInfo).value
    const { token, authorized } = authorizationInfo

    await installedStatusHandle(repoInfo, authorized, token)

    if (!repoInfo) {
      loading.close()
      if (!(authorized && token)) {
        ElMessage.error({ message: i18n.global.t('config.message3') })
      }
      return
    }

    userConfigInfo.repoList = [{ value: INIT_REPO_NAME, label: INIT_REPO_NAME }]
    userConfigInfo.selectedRepo = INIT_REPO_NAME
    userConfigInfo.branchList = [{ value: INIT_REPO_BARNCH, label: INIT_REPO_BARNCH }]
    userConfigInfo.selectedBranch = INIT_REPO_BARNCH
    userConfigInfo.branchMode = BranchModeEnum.repoBranch
    userConfigInfo.selectedDir = formatDatetime('yyyyMMdd')
    userConfigInfo.dirMode = DirModeEnum.autoDir
    userConfigInfo.dirList = []
    await persistUserConfigInfo()
    await initEmptyRepo(userConfigInfo, false)
    loading.close()
    ElMessage.success({ message: i18n.global.t('config.message4') })
    await router.push('/upload')
  } catch (err) {
    ElMessage.error({ message: i18n.global.t('config.message5') })
    console.error('oneClickAutoConfig >> ', err)
  }
}

/**
 * 设置 form 表单的 Label Width
 * @param userSettings
 */
export const setLabelWidth = (userSettings: UserSettingsModel) => {
  return userSettings.language === LanguageEnum.en ? '100rem' : '70rem'
}

/**
 * 设置 form 表单的 Label Position
 * @param userSettings
 */
export const setLabelPosition = (userSettings: UserSettingsModel) => {
  return userSettings.elementPlusSize === ElementPlusSizeEnum.large ? 'right' : 'top'
}
