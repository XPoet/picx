import type { ApiResult } from '@/utils/request/types'
import axios from 'axios'
import { apiFailureFromError } from '@/utils/request'

/** 保留既有授权交换服务，独立于会注入存储 Token 的 GitHub 客户端。 */
export async function exchangeAuthorizationCode(code: string): Promise<ApiResult<string>> {
  try {
    const response = await axios.get<unknown>('https://apis.xpoet.cn/api/github-authorize', {
      params: { code, redirect_uri: import.meta.env.VITE_REDIRECT_URI },
      timeout: 30000,
    })
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body && typeof body.data === 'string' && body.data) {
      return { ok: true, data: body.data }
    }
    return { ok: false, error: { kind: 'invalid-response', retryable: true } }
  }
  catch (error: unknown) {
    return { ok: false, error: apiFailureFromError(error) }
  }
}
