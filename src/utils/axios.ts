import Axios from 'axios'
import { PICX_CONFIG } from '@/common/model'

const baseURL = 'https://api.github.com'

const axios = Axios.create({
  baseURL,
  timeout: 300000 // 设置 HTTP 请求超时时间为 5 分钟
})

axios.defaults.headers['Content-Type'] = 'application/json'

// 发起请求之前的拦截器（前置拦截）
axios.interceptors.request.use(
  (config) => {
    const userConfig = localStorage.getItem(PICX_CONFIG)
    if (userConfig) {
      const { token } = JSON.parse(userConfig)
      if (token) {
        config.headers.Authorization = `token ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (!error?.response) {
      ElMessage.error({ duration: 6000, message: `${error}` })
    }
    return Promise.reject(error.response)
  }
)

export default axios
