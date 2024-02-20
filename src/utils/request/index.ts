import axios from './axios'
import { CustomAxiosRequestConfig } from './types'

export default function request(requestConfig: CustomAxiosRequestConfig): Promise<any> {
  const { success422, noShowErrMsg, noCache } = requestConfig

  // 接口数据不缓存处理
  if (noCache) {
    requestConfig.cache = {
      maxAge: 0 // 设置缓存的最大寿命为 0，禁用缓存
    }
    requestConfig.params = requestConfig.params ? requestConfig.params : {}
    requestConfig.params.timestamp = Date.now() // 添加时间戳参数，防止获取缓存的数据
    // requestConfig.params['no-cache'] = Date.now()
    delete requestConfig.noCache
  }

  return new Promise((resolve) => {
    axios
      .request(requestConfig)
      .then((res) => {
        const { status, data } = res
        if (res && (status === 200 || status === 201 || status === 204)) {
          resolve(data || 'SUCCESS')
        } else {
          resolve(null)
        }
      })
      .catch((err) => {
        if (success422 && err?.status === 422) {
          resolve(err?.data || 'SUCCESS')
        } else {
          const code = err?.status
          const msg = err?.data?.message
          if (!noShowErrMsg) {
            console.error('PicX Error // ', err)
            if (code !== undefined && msg !== undefined) {
              ElMessage.error({ duration: 6000, message: `Code: ${code}, Message: ${msg}` })
            }
          }
          resolve(null)
        }
      })
  })
}
