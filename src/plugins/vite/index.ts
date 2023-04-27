import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ViteEnv } from '@/common/model'
import configPWAPlugin from './pwa'

export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // 按需自动导入 Element Plus 组件
  vitePlugins.push(
    AutoImport({
      resolvers: [
        // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox ...
        ElementPlusResolver(),
        // 自动导入 Element Plus 图标组件
        IconsResolver({
          enabledCollections: ['ep']
        })
      ],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [
        // 自动导入 Element Plus 组件
        ElementPlusResolver(),
        // 自动注册 Element Plus 图标组件
        IconsResolver({
          enabledCollections: ['ep']
        })
      ],
      dts: 'src/components.d.ts'
    }),
    Icons({
      autoInstall: true
    })
  )

  // production env
  if (isBuild) {
    // add plugin vite-plugin-pwa
    if (viteEnv.VITE_USE_PWA) {
      vitePlugins.push(configPWAPlugin())
    }
  }

  return vitePlugins
}
