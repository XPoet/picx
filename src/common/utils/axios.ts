import Axios from 'axios'
import { PICX_CONFIG } from '@/common/model/storage.model'

const baseURL = 'https://api.github.com'

const axios = Axios.create({
  baseURL,
  timeout: 300000 // request timeout 请求超时 5m
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
    if (error.response && error.response.data) {
      const code = error.response.status
      const msg = error.response.data.message
      ElMessage.error(`Code: ${code}, Message: ${msg}`)
      console.error(`[PicX Error]`, error.response)
    } else {
      ElMessage.error(`${error}`)
    }

    return error.response
  }
)

export default axios
