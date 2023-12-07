import { DeployServerEnum } from '@/components/image-hosting-deploy/image-hosting-deploy.model'

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
