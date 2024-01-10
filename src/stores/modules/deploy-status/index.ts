import { Module } from 'vuex'
import RootStateTypes from '@/stores/types'
import { deepAssignObject, getUuid } from '@/utils'
import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'
import DeployStatusInfo from './types'

const deployStatusModule: Module<DeployStatusInfo, RootStateTypes> = {
  state: {
    github: {
      uuid: getUuid(),
      status: null,
      latestTime: null,
      type: DeployServerEnum.githubPages
    }
  },

  actions: {
    // 设置部署状态信息
    SET_DEPLOY_STATUS_INFO({ state }, statusInfo: DeployStatusInfo) {
      deepAssignObject(state, statusInfo)
    }
  },

  getters: {
    getDeployStatusInfo: (state): DeployStatusInfo => state
  }
}

export default deployStatusModule
