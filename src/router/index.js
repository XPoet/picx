import Vue from 'vue'
import VueRouter from 'vue-router'
import Config from "../views/Config";
import Upload from "../views/Upload";
import Management from "../views/Management";

// 阻止重复点击同一路由时的报错
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

const titleSuffix = ' | PicX 图床神器，免费、稳定、高效。'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Index',
    redirect: {
      name: 'Upload'
    }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: {
      title: '图片上传' + titleSuffix
    }
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
    meta: {
      title: '图床配置' + titleSuffix
    }
  },
  {
    path: '/management',
    name: 'Management',
    component: Management,
    meta: {
      title: '图片管理' + titleSuffix
    }
  },
  {
    path: '*',
    redirect: {
      name: 'Upload'
    }
  },
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
