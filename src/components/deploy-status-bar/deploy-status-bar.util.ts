import { computed } from 'vue'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import request from '@/utils/request'
import { PICX_INIT_DEPLOY_MSG, PICX_UPDATE_DEPLOY_MSG } from '@/common/constant'
import { store } from '@/stores'

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
      branch
    }
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
    content: window.btoa(JSON.stringify(deployStatusInfo))
  }

  if (res) {
    data.sha = res.sha
  } else {
    data.branch = branch
  }

  const res2 = await request({
    url: `/repos/${owner}/${repo}/contents/${filename}`,
    method: 'PUT',
    data,
    noShowErrMsg: true
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
