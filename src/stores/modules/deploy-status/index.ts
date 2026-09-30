import type { Module } from 'vuex'
import type DeployStatusInfo from './types'
import type RootStateTypes from '@/stores/types'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import { deepAssignObject, getUuid } from '@/utils'

const deployStatusModule: Module<DeployStatusInfo, RootStateTypes> = {
  state: {
    github: {
      uuid: getUuid(),
      status: null,
      latestTime: null,
      type: DeployServerEnum.githubPages,
    },
  },

  actions: {
    // 设置部署状态信息
    SET_DEPLOY_STATUS_INFO({ state }, statusInfo: DeployStatusInfo) {
      deepAssignObject(state, statusInfo)
    },
  },

  getters: {
    getDeployStatusInfo: (state): DeployStatusInfo => state,
  },
}

export default deployStatusModule
