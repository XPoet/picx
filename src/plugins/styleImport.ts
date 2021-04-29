/**
 * Introduces component library styles on demand.
 * https://github.com/anncwb/vite-plugin-style-import
 */

import styleImport from 'vite-plugin-style-import'

export default function configStyleImportPlugin() {
  return styleImport({
    libs: [
      {
        libraryName: 'element-plus',
        esModule: true,
        ensureStyleFile: true,
        resolveStyle: (name) => {
          return `element-plus/lib/theme-chalk/${name}.css`
        },
        resolveComponent: (name) => {
          return `element-plus/lib/${name}`
        }
      }
    ]
  })
}
