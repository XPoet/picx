import { loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import createVitePlugins from './src/plugins/vite'
import wrapperEnv from './src/utils/env'

// https://vitejs.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const isBuild = command === 'build'

  // loadEnv 中返回的是 string 类型的（即使是 boolean），使用 wrapperEnv() 转换正确的类型
  const viteEnv = wrapperEnv(env)

  return {
    plugins: createVitePlugins(viteEnv, isBuild),
    resolve: {
      alias: [
        {
          find: '@',
          replacement: '/src'
        },
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js'
        }
      ]
    },
    base: './', // 设置打包路径
    optimizeDeps: {
      exclude: ['@yireen/squoosh-browser']
    },
    server: {
      port: 4000,
      open: true,
      cors: true
    }
  }
}
