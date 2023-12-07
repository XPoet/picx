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

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value

/**
 * 重置图床配置
 */
export const resetConfig = () => {
  store.dispatch('LOGOUT')
}

/**
 * 持久化用户图床配置信息
 */
export const persistUserConfigInfo = () => {
  store.dispatch('USER_CONFIG_INFO_PERSIST')
}

/**
 * 保存用户信息
 * @param userInfo
 */
export function saveUserInfo(userInfo: any) {
  userConfigInfo.logined = true
  userConfigInfo.owner = userInfo.login
  userConfigInfo.name = userInfo.name
  userConfigInfo.email = userInfo.email
  userConfigInfo.avatarUrl = userInfo.avatar_url
  persistUserConfigInfo()
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
export const goUploadPage = async ($t: any) => {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = $t('config.message6')

  if (selectedDir === '') {
    // eslint-disable-next-line default-case
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = $t('config.message7')
        break
      case DirModeEnum.repoDir:
        warningMessage = $t('config.message8', { repo: userConfigInfo.selectedRepo })
        break
    }
    ElMessage.warning({ message: warningMessage })
  } else {
    await router.push('/upload')
  }
}

/**
 * 一键自动配置图床
 */
export const oneClickAutoConfig = async ($t: any) => {
  const { token } = userConfigInfo

  if (!token) {
    ElMessage.error({ message: $t('config.message1') })
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: $t('config.loading6')
  })

  try {
    const userInfo = await getGitHubUserInfo(userConfigInfo.token)
    console.log('getGitHubUserInfo >> ', userInfo)

    if (!userInfo) {
      loading.close()
      ElMessage.error({ message: $t('config.message2') })
      return
    }

    saveUserInfo(userInfo)

    const repoInfo = await createRepo(userConfigInfo.token)
    console.log('createRepo >> ', repoInfo)

    if (!repoInfo) {
      loading.close()
      ElMessage.error({ message: $t('config.message3') })
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
    persistUserConfigInfo()
    await initEmptyRepo(userConfigInfo, false)
    loading.close()
    ElMessage.success({ message: $t('config.message4') })
    await router.push('/upload')
  } catch (err) {
    ElMessage.error({ message: $t('config.message5') })
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
