import { DeployServerEnum } from '@/components/deploy-bar/deploy-bar.model'

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
