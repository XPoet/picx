import type { AxiosResponse } from 'axios'
import type { ApiFailure, ApiResult, CustomAxiosRequestConfig } from './types'
import { isAxiosError } from 'axios'
import i18n from '@/plugins/vue/i18n'
import axios from './axios'

function failureFromStatus(status: number, headers?: AxiosResponse['headers']): ApiFailure {
  const retryAfter = headers?.['retry-after']
  const remaining = headers?.['x-ratelimit-remaining']
  const limited = status === 429 || (status === 403 && (String(remaining) === '0' || retryAfter !== undefined))
  const kind = limited
    ? 'rate-limited'
    : status === 401
      ? 'unauthenticated'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'not-found'
          : status === 409 ? 'conflict' : 'service'
  const seconds = Number(retryAfter)
  const dateMs = typeof retryAfter === 'string' ? Date.parse(retryAfter) - Date.now() : NaN
  const retryAfterMs = Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, dateMs)
  return {
    kind,
    status,
    retryable: limited || status >= 500 || status === 408 || status === 409,
    ...(Number.isFinite(retryAfterMs) ? { retryAfterMs } : {}),
  }
}

function prepare(config: CustomAxiosRequestConfig): CustomAxiosRequestConfig {
  return config.noCache
    ? { ...config, params: { ...config.params, timestamp: Date.now() }, cache: { maxAge: 0 } }
    : config
}

async function perform(config: CustomAxiosRequestConfig): Promise<ApiResult<unknown>> {
  try {
    const response = await axios.request<unknown>(prepare(config))
    if (response.status >= 200 && response.status < 300) {
      return { ok: true, data: response.data }
    }
    return { ok: false, error: failureFromStatus(response.status, response.headers) }
  }
  catch (error: unknown) {
    if (isAxiosError(error) && error.response) {
      if (config.success422 && error.response.status === 422) {
        return { ok: true, data: error.response.data || 'SUCCESS' }
      }
      return { ok: false, error: failureFromStatus(error.response.status, error.response.headers) }
    }
    return {
      ok: false,
      error: { kind: navigator.onLine === false ? 'offline' : 'network', retryable: true },
    }
  }
}

export async function requestResult<T>(
  config: CustomAxiosRequestConfig,
  guard: (value: unknown) => value is T,
): Promise<ApiResult<T>> {
  const result = await perform({ ...config, success422: false })
  if (!result.ok) {
    return result
  }
  return guard(result.data)
    ? { ok: true, data: result.data }
    : { ok: false, error: { kind: 'invalid-response', retryable: true } }
}

// 旧调用方保留 data / null 与 204、success422 语义。
export default async function request(requestConfig: CustomAxiosRequestConfig): Promise<any> {
  const result = await perform(requestConfig)
  if (result.ok) {
    return result.data || 'SUCCESS'
  }
  if (!requestConfig.noShowErrMsg) {
    ElMessage.error({ duration: 6000, message: i18n.global.t(`request_error.${result.error.kind}`) })
  }
  return null
}
