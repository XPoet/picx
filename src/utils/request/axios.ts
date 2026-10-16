import Axios from 'axios'
import { AXIOS_BASE_URL, AXIOS_TIMEOUT, LS_CONFIG } from '@/common/constant'
import { getLocal } from '@/utils/storage'

const axios = Axios.create({
  baseURL: AXIOS_BASE_URL,
  timeout: AXIOS_TIMEOUT,
})

axios.defaults.headers['Content-Type'] = 'application/json'

axios.interceptors.request.use((config) => {
  const target = new URL(config.url ?? '', config.baseURL || AXIOS_BASE_URL)
  const trusted = target.origin === new URL(AXIOS_BASE_URL).origin
    && !target.username && !target.password
  if (!trusted) {
    config.headers.delete('Authorization')
    return config
  }
  // 显式凭据用于本次验证，不能被旧存储覆盖。
  if (!config.headers.has('Authorization')) {
    const saved: unknown = getLocal(LS_CONFIG)
    if (saved && typeof saved === 'object' && 'token' in saved && typeof saved.token === 'string' && saved.token) {
      config.headers.set('Authorization', `Bearer ${saved.token}`)
    }
  }
  return config
})

// 保留 AxiosError 到统一转换边界；此处不显示或记录原始错误。
export default axios
