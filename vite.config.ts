import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './src/plugins/vite'
import wrapperEnv from './src/utils/env'

export default defineConfig(({ command, mode }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root, '')
  const isBuild = command === 'build'

  const viteEnv = wrapperEnv(env)
  const variablesPath = fileURLToPath(new URL('./src/styles/variables.styl', import.meta.url))

  return {
    plugins: createVitePlugins(viteEnv, isBuild),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        stylus: {
          additionalData: `
            @import '${variablesPath}'
            $picx-primary-color = #4975c6
          `,
        },
      },
    },
    base: './',
    optimizeDeps: {
      exclude: ['@jsquash/avif', '@jsquash/jpeg', '@jsquash/webp', '@jsquash/oxipng'],
    },
    server: {
      port: 4000,
      open: true,
      cors: true,
    },
    build: {
      minify: 'oxc',
    },
  }
})
