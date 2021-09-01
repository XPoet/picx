import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { ViteEnv } from '@/common/model/viteConfig.model'

import configPWAPlugin from './pwa'
import importElementPlus from 'vite-plugin-element-plus'


export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // add plugin vite-plugin-element-plus
  vitePlugins.push(importElementPlus({}))

  // production env
  if (isBuild) {
    // add plugin vite-plugin-pwa
    if (viteEnv.VITE_USE_PWA) {
      vitePlugins.push(configPWAPlugin(viteEnv))
    }
  }

  return vitePlugins
}
