import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { setWindowTitle } from '@/utils'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/picx-login/picx-login.vue'),
    meta: {
      title: 'login',
    },
  },
  {
    path: '/config',
    name: 'config',
    component: () => import('@/views/picx-config/picx-config.vue'),
    meta: {
      title: 'nav.config',
    },
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('@/views/upload-image/upload-image.vue'),
    meta: {
      title: 'nav.upload',
    },
  },
  {
    path: '/management',
    name: 'Management',
    component: () => import('@/views/imgs-management/imgs-management.vue'),
    meta: {
      title: 'nav.management',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/picx-settings/picx-settings.vue'),
    meta: {
      title: 'nav.settings',
    },
  },
  {
    path: '/toolbox',
    name: 'Toolbox',
    component: () => import('@/views/picx-toolbox/picx-toolbox.vue'),
    meta: {
      title: 'nav.toolbox',
    },
    children: [
      {
        path: '/toolbox/compress',
        name: 'Compress',
        component: () => import('@/components/tools/compress-tool/compress-tool.vue'),
      },
      {
        path: '/toolbox/base64',
        name: 'Base64',
        component: () => import('@/components/tools/base64-tool/base64-tool.vue'),
      },
      {
        path: '/toolbox/watermark',
        name: 'Watermark',
        component: () => import('@/components/tools/watermark-tool/watermark-tool.vue'),
      },
    ],
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: () => import('@/views/feedback-info/feedback-info.vue'),
    meta: {
      title: 'nav.feedback',
    },
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.title) {
    setWindowTitle(to.meta.title as string)
  }
})

export default router
