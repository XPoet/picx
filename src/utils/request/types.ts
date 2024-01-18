import { AxiosRequestConfig } from 'axios'

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  success422?: boolean
  noShowErrMsg?: boolean
  cache?: any
  noCache?: boolean
}
