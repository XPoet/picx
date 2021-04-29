import { createApp } from 'vue'
import importUIFramework from '@/common/utils/importUIFramework'
import router from '@/router/index'
import { key, store } from '@/store/index'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import './style.styl'

// update service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // show a prompt to user
  },
  onOfflineReady() {
    // show a ready to work offline to user
  }
})

updateSW()

const app = createApp(App)
importUIFramework(app).use(router).use(store, key).mount('#app')
