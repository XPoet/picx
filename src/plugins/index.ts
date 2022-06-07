import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { ViteEnv } from '@/common/model/vite-config.model'

import configPWAPlugin from './pwa'

export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // On-demand import style for Element Plus
  vitePlugins.push(
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  )

  // production env
  if (isBuild) {
    // add plugin vite-plugin-pwa
    if (viteEnv.VITE_USE_PWA) {
      vitePlugins.push(configPWAPlugin(viteEnv))
    }
  }

  return vitePlugins
}
