import { computed } from 'vue'
import { store } from '@/store'
import { BranchModeEnum, DirModeEnum } from '@/common/model'
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
 * 去往图片上传页面
 */
export const goUploadPage = async () => {
  const { selectedDir, dirMode } = userConfigInfo
  let warningMessage: string = '目录不能为空！'

  if (selectedDir === '') {
    switch (dirMode) {
      case DirModeEnum.newDir:
        warningMessage = '请在输入框输入一个新目录！'
        break
      case DirModeEnum.repoDir:
        warningMessage = `请选择 ${userConfigInfo.selectedRepo} 仓库下的一个目录！`
        break
      default:
        warningMessage = '请在输入框输入一个新目录！'
        break
    }
    ElMessage.warning(warningMessage)
  } else {
    await router.push('/upload')
  }
}

/**
 * 一键自动配置图床
 */
export const oneClickAutoConfig = async () => {
  const { token } = userConfigInfo

  if (!token) {
    ElMessage.error('GitHub Token 不能为空！')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在自动配置...'
  })

  const userInfo = await getGitHubUserInfo(userConfigInfo.token)
  console.log('getGitHubUserInfo >> ', userInfo)

  if (!userInfo) {
    loading.close()
    ElMessage.error('用户信息获取失败，请确认 Token 是否正确')
    return
  }

  saveUserInfo(userInfo)

  const repoInfo = await createRepo(userConfigInfo.token)
  console.log('createRepo >> ', repoInfo)

  if (!repoInfo) {
    loading.close()
    ElMessage.error('自动创建 GitHub 仓库失败，请稍后再试！')
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
  ElMessage.success('自动配置成功')
  await router.push('/upload')
}
