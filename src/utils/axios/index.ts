import Axios from 'axios'

const baseURL = 'https://api.github.com'

const service = Axios.create({
  baseURL,
  timeout: 10000  // request timeout 请求超时 10s
})

// 发起请求之前的拦截器（前置拦截）
service.interceptors.request.use(config => {

  // 如果有token 就携带 token
  const token = window.localStorage.getItem('accessToken')

  if (token) {
    config.headers.common.Authorization = token
  }

  return config

}, error => {
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(response => {
  const result = response.data

  if (response.status !== 200) {
    return Promise.reject(new Error(result.message || 'Error'))
  } else {
    return result
  }

}, error => Promise.reject(error))


export default service


