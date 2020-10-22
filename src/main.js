import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style.scss'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Axios from "axios"
import './axios'

Vue.use(ElementUI);
Vue.prototype.$axios = Axios

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
