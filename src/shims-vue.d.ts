/// <reference types="@plugin-web-update-notification/vite" />
declare module '*.vue' {
  import { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}
