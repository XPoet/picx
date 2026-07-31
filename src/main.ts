import { createApp } from 'vue'
import useDirective from '@/common/directive'
import i18n from '@/plugins/vue/i18n'
import router from '@/router/index'
import { pinia } from '@/stores'
import App from './App.vue'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/base.styl'

const app = createApp(App)

useDirective(app)

app.use(router).use(pinia).use(i18n).mount('#app')
