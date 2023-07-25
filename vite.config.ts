import { loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import * as path from 'path'
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
    css: {
      preprocessorOptions: {
        stylus: {
          // 引入 variables.styl 文件
          imports: [path.resolve(__dirname, 'src/styles/variables.styl')],
          // 定义全局变量
          additionalData: `
            $picx-primary-color = #4975c6
          `
        }
      }
    },
    base: './', // 设置打包路径
    optimizeDeps: {
      exclude: ['@yireen/squoosh-browser']
    },
    server: {
      port: 4000,
      open: true,
      cors: true
    },
    build: {
      minify: 'terser', // 启用 terser 压缩
      terserOptions: {
        compress: {
          pure_funcs: ['console.log'], // 删除 console.log
          drop_debugger: true // 删除 debugger
        }
      }
    }
  }
}
