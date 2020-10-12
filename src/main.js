import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style.scss'

// 导入 ElementUI
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

// 导入 Axios
import Axios from "axios";

Vue.use(ElementUI);
Vue.prototype.$axios = Axios

// Axios 全局拦截
import './axios'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
