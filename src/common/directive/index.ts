import type { App } from 'vue'
import contextmenuDirective from './contextmenu'

const useDirective = (app: App) => {
  // 添加自定义指令
  app.directive('contextmenu', contextmenuDirective)
}
export default useDirective
