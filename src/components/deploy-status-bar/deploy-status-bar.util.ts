import { computed } from 'vue'
import {
  checkoutGhPagesBranch,
  CloudCnameSyncStatusEnum,
  syncCloudCnameFile,
} from '@/common/api'
import { PICX_INIT_DEPLOY_MSG, PICX_UPDATE_DEPLOY_MSG } from '@/common/constant'
import { ImageLinkTypeEnum } from '@/common/model'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import i18n from '@/plugins/vue/i18n'
import { store } from '@/stores'
import request from '@/utils/request'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const deployStatusInfo = computed(() => store.getters.getDeployStatusInfo).value

const filename = '.deploy'

/**
 * 获取云端仓库存储的部署状态信息
 */
export const getCloudDeployInfo = async () => {
  const { owner, repo, branch } = userConfigInfo

  if (!owner || !repo || !branch) {
    return null
  }

  const res = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'GET',
    noShowErrMsg: true,
    noCache: true,
    params: {
      branch,
    },
  })

  return Promise.resolve(res)
}

/**
 * 保存部署状态信息到云端仓库
 */
export const saveCloudDeployInfo = async () => {
  const { owner, repo, branch } = userConfigInfo

  const res = await getCloudDeployInfo()

  const data: any = {
    message: res ? PICX_UPDATE_DEPLOY_MSG : PICX_INIT_DEPLOY_MSG,
    content: window.btoa(JSON.stringify(deployStatusInfo)),
  }

  if (res) {
    data.sha = res.sha
  }
  else {
    data.branch = branch
  }

  const res2 = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'PUT',
    data,
    noShowErrMsg: true,
  })

  return Promise.resolve(res2)
}

/**
 * 设置云端仓库的部署状态到本地
 * @param content
 */
export const setCloudDeployInfo = async (content: string) => {
  await store.dispatch('SET_DEPLOY_STATUS_INFO', JSON.parse(window.atob(content)))
}

/**
 * 一键部署 GitHub Pages（部署按钮与设置页自定义域名保存共用）。
 *
 * 部署前先把用户设置（.settings 同步的 customDomain）同步到图床仓库当前分支根目录的
 * CNAME 文件（内容已一致则跳过写入），gh-pages 分支由当前分支复制创建，自定义域名随
 * 分支带入，保证部署结果与设置一致；CNAME 同步失败时中断部署。
 *
 * @param cb 部署结束回调，参数为是否成功（CNAME 同步失败也回调 false）
 */
export const deployGhPages = async (cb?: (success: boolean) => void) => {
  const userConfigInfo = store.getters.getUserConfigInfo
  const userSettings = store.getters.getUserSettings
  const deployStatusInfo = store.getters.getDeployStatusInfo

  // 先同步主分支 CNAME，再执行一键部署
  const status = await syncCloudCnameFile(
    userConfigInfo,
    userSettings.deploy.customDomain,
    userConfigInfo.branch,
  )

  if (status === CloudCnameSyncStatusEnum.failed) {
    ElMessage.error(i18n.global.t('settings_page.image_hosting_deploy.custom_domain_fail'))
    cb?.(false)
    return
  }

  if (
    status === CloudCnameSyncStatusEnum.created
    || status === CloudCnameSyncStatusEnum.updated
  ) {
    ElMessage.success(i18n.global.t('settings_page.image_hosting_deploy.custom_domain_synced'))
  }
  else if (status === CloudCnameSyncStatusEnum.deleted) {
    ElMessage.success(i18n.global.t('settings_page.image_hosting_deploy.custom_domain_deleted'))
  }

  checkoutGhPagesBranch(userConfigInfo, (event: boolean) => {
    deployStatusInfo.github.status = event
    deployStatusInfo.github.latestTime = Date.now()
    // 保存部署状态到云端仓库
    saveCloudDeployInfo()
    if (event) {
      // 部署成功
      userSettings.imageLinkType.selected = ImageLinkTypeEnum.GitHubPages
      store.dispatch('USER_SETTINGS_PERSIST')
      ElMessage.success(i18n.global.t('settings_page.image_hosting_deploy.success'))
    }
    else {
      // 部署失败
      ElMessage.error(i18n.global.t('settings_page.image_hosting_deploy.fail2'))
    }
    cb?.(event)
  })
}

export const getDeployServerName = (server: DeployServerEnum) => {
  switch (server) {
    case DeployServerEnum.githubPages:
      return 'GitHub Pages'
    case DeployServerEnum.vervel:
      return 'Vercel'
    default:
      return 'GitHub Pages'
  }
}
