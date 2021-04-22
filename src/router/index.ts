import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Config from '@/views/config.vue'
import Upload from '@/views/upload.vue'
import Management from '@/views/management.vue'

const titleSuffix = ' | PicX 图床神器'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Index',
    redirect: {
      name: 'Upload'
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
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: {
      title: '图片上传' + titleSuffix
    }
  },
  {
    path: '/management',
    name: 'Management',
    component: Management,
    meta: {
      title: '图床管理' + titleSuffix
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/help.vue'),
    meta: {
      title: '帮助' + titleSuffix
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/about.vue'),
    meta: {
      title: '关于反馈' + titleSuffix
    }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) (<any>window).document.title = to.meta.title
  next()
})

export default router
