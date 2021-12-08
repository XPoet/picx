import { createApp } from 'vue'
import styleImport from '@/common/utils/style-import'
import router from '@/router/index'
import { key, store } from '@/store/index'
import App from './App.vue'

if (import.meta.env.MODE === 'production') {
  import('@/common/utils/register-sw')
}

window.addEventListener('resize', (e: any) => {
  if (e.target?.innerWidth <= 780) {
    console.log('平板模式')
  }
})

const app = createApp(App)
styleImport(app)
app.use(router).use(store, key).mount('#app')
