import { createApp } from 'vue'
import styleImport from '@/common/utils/style-import'
import router from '@/router/index'
import { key, store } from '@/store/index'
import App from './App.vue'
import './style/style.styl'

if (import.meta.env.MODE === 'production') {
  import('@/common/utils/register-sw')
}

const app = createApp(App)
styleImport(app)
app.use(router).use(store, key).mount('#app')
