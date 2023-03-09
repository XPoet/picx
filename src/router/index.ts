import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import config from '@/views/my-config/my-config.vue'
import upload from '@/views/upload/upload.vue'
import management from '@/views/management/management.vue'
import tutorials from '@/views/use-tutorials/use-tutorials.vue'
import settings from '@/views/my-settings/my-settings.vue'

const titleSuffix = ` | PicX 图床神器`

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'index',
    redirect: {
      name: 'upload'
    }
  },
  {
    path: '/config',
    name: 'config',
    component: config,
    meta: {
      title: `图床配置${titleSuffix}`
    }
  },
  {
    path: '/upload',
    name: 'upload',
    component: upload,
    meta: {
      title: `图片上传${titleSuffix}`
    }
  },
  {
    path: '/management',
    name: 'Management',
    component: management,
    meta: {
      title: `图床管理${titleSuffix}`
    }
  },
  {
    path: '/tutorials',
    name: 'tutorials',
    component: tutorials,
    meta: {
      title: `使用教程${titleSuffix}`
    }
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('@/views/help-info/help-info.vue'),
    meta: {
      title: `帮助反馈${titleSuffix}`
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: settings,
    meta: {
      title: `我的设置${titleSuffix}`
    }
  }
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
