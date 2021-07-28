import { createApp } from 'vue'
import styleImport from '@/common/utils/styleImport'
import 'element-plus/lib/theme-chalk/base.css'
import router from '@/router/index'
import { key, store } from '@/store/index'
import App from './App.vue'
import './style.styl'

if (import.meta.env.MODE === 'production') {
  import('@/common/utils/registerSW')
}

const app = createApp(App)
styleImport(app).use(router).use(store, key).mount('#app')
