import Vue from 'vue'
import VueRouter from 'vue-router'
import Config from "../views/Config";
import Upload from "../views/Upload";
import Management from "../views/Management";

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
