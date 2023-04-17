import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { ViteEnv } from '@/common/model'
import configPWAPlugin from './pwa'

export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // 按需自动导入 Element Plus 组件
  vitePlugins.push(
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
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
