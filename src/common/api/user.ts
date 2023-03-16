import axios from '@/utils/axios'

/**
 * 获取 GitHub 用户信息
 * @param token
 * @param callback
 */
export const getUserInfoByToken = <T extends (...args: any) => void>(
  token: string,
  callback: T
) => {
  axios
    .get('/user', {
      headers: { Authorization: `token ${token}` }
    })
    .then((res: any) => {
      console.log('getUserInfo >> ', res)
      if (res && res.status === 200) {
        callback(res.data)
      } else {
        callback(null)
      }
    })
    .catch(() => {
      callback(null)
    })
}
