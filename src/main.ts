import { createApp } from 'vue'
import router from '@/router/index'
import { key, store } from '@/store'
import App from './App.vue'

if (import.meta.env.MODE === 'production') {
  // @ts-ignore
  import('@/common/utils/register-sw.ts')
}

const app = createApp(App)
// @ts-ignore
app.use(router).use(store, key).mount('#app')
