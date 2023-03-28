import request from '@/utils/request'

/**
 * 获取 GitHub 用户信息
 * @param token
 */
export const getGitHubUserInfo = (token: string) => {
  return request({
    url: '/user',
    method: 'GET',
    headers: { Authorization: `token ${token}` }
  })
}
