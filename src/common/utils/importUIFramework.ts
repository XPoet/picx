import { App } from 'vue'
import { ElIcon, ElLoading, ElCard, ElButton } from 'element-plus'

export default function importUiFramework(app: App) {
  // 按需载入 Element Plus 组件
  app.use(ElButton).use(ElCard).use(ElLoading).use(ElIcon)
  return app
}
