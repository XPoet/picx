import { createApp } from 'vue'
import importUIFramework from '@/common/utils/importUIFramework'
import router from '@/router/index'
import store from '@/store/index'
import App from './App.vue'

import './style.styl'

const app = createApp(App)
importUIFramework(app).use(router).use(store).mount('#app')
