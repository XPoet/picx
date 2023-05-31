import { createApp } from 'vue'
import router from '@/router/index'
import { key, store } from '@/stores'
import App from './App.vue'
import i18n from '@/plugins/vue/i18n'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/base.styl'
import useDirective from '@/common/directive'

const app = createApp(App)

useDirective(app)

app.use(router).use(store, key).use(i18n).mount('#app')
