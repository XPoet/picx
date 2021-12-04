import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'
import { ViteEnv } from '@/common/model/viteConfig.model'

import configPWAPlugin from './pwa'

export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // use plugin unplugin-element-plus
  // On-demand import style for Element Plus
  vitePlugins.push(ElementPlus())

  // production env
  if (isBuild) {
    // add plugin vite-plugin-pwa
    if (viteEnv.VITE_USE_PWA) {
      vitePlugins.push(configPWAPlugin(viteEnv))
    }
  }

  return vitePlugins
}
