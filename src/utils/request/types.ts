import type { AxiosRequestConfig } from 'axios'

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  success422?: boolean
  noShowErrMsg?: boolean
  cache?: { maxAge: number }
  noCache?: boolean
}

export type ApiErrorKind
  = | 'unauthenticated' | 'forbidden' | 'not-found'
    | 'offline' | 'network' | 'rate-limited'
    | 'conflict' | 'invalid-response' | 'service'

export interface ApiFailure {
  kind: ApiErrorKind
  status?: number
  retryable: boolean
  retryAfterMs?: number
}

export type ApiResult<T>
  = | { ok: true, data: T }
    | { ok: false, error: ApiFailure }
