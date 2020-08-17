import Vue from 'vue'
import VueRouter from 'vue-router'
import Config from "../views/Config/";
import Upload from "../views/Upload";
import Management from "../views/Management";

// 阻止重复点击同一路由报错
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Upload',
    component: Upload
  },
  {
    path: '/config',
    name: 'Config',
    component: Config
  },
  {
    path: '/management',
    name: 'Management',
    component: Management
  },
]

const router = new VueRouter({
  routes
})

export default router
