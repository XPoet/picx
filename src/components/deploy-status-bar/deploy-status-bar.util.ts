import type { CloudCnameSyncStatusEnum } from '@/common/api/deploy'
import type { ApiFailure } from '@/utils/request/types'
import { ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { checkoutGhPagesBranch, getGitReference } from '@/common/api/branch'
import { getCloudCnameFile, isValidCustomDomain, normalizeCustomDomain, syncCloudCnameFileResult } from '@/common/api/deploy'
import { configurePages, getPagesInfo, queryPagesDeployment } from '@/common/api/pages'
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
interface DomainSaveFeedback {
  phase: 'running' | 'cancelled' | 'failed' | 'waiting' | 'available'
  domain: string
  localSaved: boolean
  cnameStatus?: CloudCnameSyncStatusEnum
  scope?: 'local' | 'cname' | 'deployment'
  error?: ApiFailure
}
export const domainSaveFeedback = shallowRef<DomainSaveFeedback | null>(null)
let domainRequestId = 0
export const deployment = createDeploymentService({
  target: currentRepository,
  query: queryPagesDeployment,
  submit: async (target, current, step, request) => {
    if (!request?.saveDomain && current())
      domainSaveFeedback.value = null
    const domain = request?.domain ?? store.getters.getUserSettings.deploy.customDomain
    const report = (patch: Partial<DomainSaveFeedback>) => {
      if (request?.saveDomain && current())
        domainSaveFeedback.value = { ...domainSaveFeedback.value, phase: 'running', domain, localSaved: false, ...patch }
    }
    const cancelled = () => {
      report({ phase: 'cancelled' })
      return null
    }
    if (domain && !isValidCustomDomain(domain))
      return { ok: false, error: { kind: 'invalid-response', retryable: false } }
    const existing = await getGitReference(target, GH_PAGES)
    if (!current())
      return null
    if (!existing.ok && existing.error.kind !== 'not-found')
      return existing
    if (existing.ok && !await confirmAction(i18n.global.t('deployment.rebuild_confirm', target)))
      return cancelled()
    if (!current())
      return null
    let deleteSha: string | undefined
    if (!domain) {
      const cname = await getCloudCnameFile(target)
      if (!current())
        return null
      if (!cname.ok) {
        report({ phase: 'failed', scope: 'cname', error: cname.error })
        return cname
      }
      const pages = await getPagesInfo(target)
      if (!current())
        return null
      if (!pages.ok && pages.error.kind !== 'not-found') {
        report({ phase: 'failed', scope: 'cname', error: pages.error })
        return pages
      }
      const domains = new Set<string>()
      if (cname.data.kind === 'present')
        domains.add(cname.data.domain)
      if (pages.ok && pages.data.cname)
        domains.add(pages.data.cname)
      if (domains.size && !await confirmAction(i18n.global.t('domain_settings.remove_confirm', { domain: [...domains].join('、') })))
        return cancelled()
      if (cname.data.kind === 'present')
        deleteSha = cname.data.file.sha
    }
    if (!current())
      return null
    if (request?.saveDomain) {
      const picx = usePicxStore(pinia)
      if (picx.getUserSettings.deploy.customDomain !== domain && !picx.SAVE_SETTINGS_CANDIDATE({ deploy: { customDomain: domain } })) {
        report({ phase: 'failed', scope: 'local' })
        return { ok: false, error: { kind: 'service', retryable: true } }
      }
      report({ localSaved: true })
    }
    step('cname')
    const cname = await syncCloudCnameFileResult(target, domain, target.branch, { allowDelete: deleteSha !== undefined, expectedSha: deleteSha, current })
    if (!current())
      return null
    if (!cname.ok) {
      report({ phase: 'failed', localSaved: request?.saveDomain === true, scope: 'cname', error: cname.error })
      return cname
    }
    report({ localSaved: request?.saveDomain === true, cnameStatus: cname.data.status })
    step('branch')
    const branch = await checkoutGhPagesBranch(target, existing.ok, current)
    if (!branch.ok || !current())
      return branch
    step('pages')
    const pages = await configurePages(target, current, domain)
    return pages.ok ? branch : pages
  },
})

export const deploymentOnline = ref(navigator.onLine !== false)
export const canDeploy = computed(() => Boolean(currentRepository()) && deploymentOnline.value && !deployment.busy.value && !usePicxStore(pinia).uploadTargetBusy)
export async function saveDomainAndDeploy(value: string) {
  if (!canDeploy.value)
    return deployment.state.value
  const domain = normalizeCustomDomain(value)
  const id = ++domainRequestId
  domainSaveFeedback.value = { phase: 'running', domain, localSaved: false }
  const result = await deployment.deploy({ domain, saveDomain: true })
  if (id === domainRequestId && domainSaveFeedback.value?.phase !== 'cancelled') {
    const feedback = domainSaveFeedback.value
    if (feedback)
      domainSaveFeedback.value = { ...feedback, phase: result.phase === 'available' ? 'available' : result.phase === 'waiting' ? 'waiting' : 'failed', ...(result.phase === 'failed' ? { scope: feedback.scope ?? 'deployment', error: result.error } : {}) }
  }
  return result
}

const deploymentEntries = new Set<() => boolean>()
export function useDeploymentEntry(enabled: () => boolean) {
  deploymentEntries.add(enabled)
  onScopeDispose(() => deploymentEntries.delete(enabled))
}
export function deploymentShortcutEnabled() {
  return canDeploy.value && [...deploymentEntries].some(enabled => enabled())
}
export function useDeploymentLifecycle() {
  const picx = usePicxStore(pinia)
  const stop = watch(() => `${repositoryKey(currentRepository())}:${picx.connectionSessionId}`, () => {
    deployment.reset()
    domainRequestId += 1
    domainSaveFeedback.value = null
  }, { flush: 'sync' })
  const online = () => deploymentOnline.value = true
  const offline = () => deploymentOnline.value = false
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  onScopeDispose(() => {
    stop()
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
  })
}

export const deployGhPages = async (cb?: (success: boolean) => void) => {
  if (!canDeploy.value) {
    cb?.(false)
    return deployment.state.value
  }
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
