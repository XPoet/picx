import Axios from 'axios'
import { ElMessage } from 'element-plus'

const baseURL = 'https://api.github.com'

const axios = Axios.create({
  baseURL,
  timeout: 300000  // request timeout 请求超时 5m
})

// 发起请求之前的拦截器（前置拦截）
axios.interceptors.request.use(config => {

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
axios.interceptors.response.use(response => {
  return response

}, error => {
  if (error.response && error.response.data) {
    const code = error.response.status
    const msg = error.response.data.message
    ElMessage.error(`Code: ${code}, Message: ${msg}`)
    console.error(`[PicX Error]`, error.response)
  } else {
    ElMessage.error(`${error}`)
  }

  return error.response
})

export default axios


