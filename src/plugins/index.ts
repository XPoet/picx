import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { ViteEnv } from '@/common/model/viteConfig.model'

import { configPwaConfig } from './pwa'
import { configStyleImportPlugin } from './styleImport'

// eslint-disable-next-line import/prefer-default-export
export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const vitePlugins: (Plugin | Plugin[])[] = [vue()]

  // vite-plugin-style-import
  vitePlugins.push(configStyleImportPlugin())

  // 生产环境配置
  if (isBuild) {
    // vite-plugin-pwa
    vitePlugins.push(configPwaConfig(viteEnv))
  }

  return vitePlugins
}
