import { AxiosRequestConfig } from 'axios'

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  success422?: boolean
  noShowErrorMsg?: boolean
  cache?: any
  noCache?: boolean
}
