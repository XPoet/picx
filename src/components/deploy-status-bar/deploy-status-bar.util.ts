import { watch } from 'vue'
import { checkoutGhPagesBranch, getGitReference } from '@/common/api/branch'
import { CloudCnameSyncStatusEnum, syncCloudCnameFile } from '@/common/api/deploy'
import { configurePages, queryPagesDeployment } from '@/common/api/pages'
import { GH_PAGES, PICX_INIT_DEPLOY_MSG, PICX_UPDATE_DEPLOY_MSG } from '@/common/constant'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import i18n from '@/plugins/vue/i18n'
import { createDeploymentService, repositoryKey } from '@/services/github-deployment'
import { pinia, store } from '@/stores'
import { usePicxStore } from '@/stores/picx-store'
import request from '@/utils/request'

const filename = '.deploy'

/**
 * 获取云端仓库存储的部署状态信息
 */
export const getCloudDeployInfo = async () => {
  const { owner, repo, branch } = store.getters.getUserConfigInfo

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
  const { owner, repo, branch } = store.getters.getUserConfigInfo

  const res = await getCloudDeployInfo()

  const data: { message: string, content: string, sha?: string, branch?: string } = {
    message: res ? PICX_UPDATE_DEPLOY_MSG : PICX_INIT_DEPLOY_MSG,
    content: window.btoa(JSON.stringify(store.getters.getDeployStatusInfo)),
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

function currentRepository() {
  const { owner, repo, branch, logined } = store.getters.getUserConfigInfo
  return logined && owner && repo && branch ? { owner, repo, branch } : null
}
async function confirmAction(message: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, i18n.global.t('tip'), { type: 'warning', confirmButtonText: i18n.global.t('confirm'), cancelButtonText: i18n.global.t('cancel') })
    return true
  }
  catch { return false }
}
export const deployment = createDeploymentService({
  target: currentRepository,
  query: queryPagesDeployment,
  submit: async (target, current, step) => {
    const existing = await getGitReference(target, GH_PAGES)
    if (!current())
      return null
    if (!existing.ok && existing.error.kind !== 'not-found')
      return existing
    if (existing.ok && !await confirmAction(i18n.global.t('deployment.rebuild_confirm', target)))
      return null
    if (!current())
      return null
    const domain = store.getters.getUserSettings.deploy.customDomain
    if (!domain && !await confirmAction(i18n.global.t('deployment.empty_domain_confirm')))
      return null
    if (!current())
      return null
    step('cname')
    const cname = await syncCloudCnameFile(store.getters.getUserConfigInfo, domain, target.branch)
    if (!current())
      return null
    if (cname === CloudCnameSyncStatusEnum.failed)
      return { ok: false, error: { kind: 'service', retryable: true } }
    step('branch')
    const branch = await checkoutGhPagesBranch(target, existing.ok, current)
    if (!branch.ok || !current())
      return branch
    step('pages')
    const pages = await configurePages(target, current)
    return pages.ok ? branch : pages
  },
})
export function useDeploymentLifecycle() {
  const picx = usePicxStore(pinia)
  return watch(() => `${repositoryKey(currentRepository())}:${picx.connectionAttemptId}`, () => deployment.reset(), { flush: 'sync' })
}
export const deployGhPages = async (cb?: (success: boolean) => void) => {
  const result = await deployment.deploy()
  cb?.(result.phase === 'available')
  return result
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
