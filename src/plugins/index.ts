import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { ViteEnv } from '@/common/model/viteConfig.model'

import configPWAPlugin from './pwa'
import configStyleImportPlugin from './styleImport'

export default function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // add plugin vite-plugin-style-import
  vitePlugins.push(configStyleImportPlugin())

  // production env
  if (isBuild) {
    // add plugin vite-plugin-pwa
    if (viteEnv.VITE_USE_PWA) {
      vitePlugins.push(configPWAPlugin(viteEnv))
    }
  }

  return vitePlugins
}
