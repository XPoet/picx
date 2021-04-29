export declare type Recordable<T = any> = Record<string, T>

export declare interface ViteEnv {
  VITE_PORT?: number
  VITE_USE_PWA?: boolean
  VITE_PUBLIC_PATH?: string
  VITE_GLOB_APP_TITLE?: string
  VITE_GLOB_APP_SHORT_NAME?: string
  VITE_OPEN_BROWSER?: boolean
  VITE_CORS?: boolean
}
