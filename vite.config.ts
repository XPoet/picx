import type { UserConfig, ConfigEnv } from 'vite'
import { loadEnv } from 'vite'
import { resolve } from 'path'
import createVitePlugins from './src/plugins'
import wrapperEnv from './src/common/utils/env'

function pathResolve(dir: string) {
  return resolve(__dirname, '.', dir)
}

// https://vitejs.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const isBuild = command === 'build'

  // loadEnv 中返回的是 string 类型的（即使是 boolean），下面的方法可以返回正确的类型
  const viteEnv = wrapperEnv(env)
  const { VITE_PORT, VITE_PUBLIC_PATH, VITE_OPEN_BROWSER, VITE_CORS } = viteEnv

  return {
    plugins: createVitePlugins(viteEnv, isBuild),
    resolve: {
      alias: {
        '@': pathResolve('src') // 设置 @ 指向 src
      }
    },
    base: VITE_PUBLIC_PATH, // 设置打包路径
    server: {
      port: VITE_PORT,
      open: VITE_OPEN_BROWSER,
      cors: VITE_CORS
    }
  }
}
