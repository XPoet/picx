import { DeployServerEnum } from '@/components/deploy-status-bar/deploy-status-bar.model'

export interface DeployItemInfo {
  uuid: string
  status: boolean | null
  latestTime: number | null
  type: DeployServerEnum
}

export default interface DeployStatusInfo {
  [key: string]: DeployItemInfo
}
