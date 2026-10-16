import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { store } from '@/stores'
import { setWindowTitle } from '@/utils'
import { connectionLocation, legacyConfigLocation, readAuthorizationCallback } from '@/utils/login-navigation'

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
    redirect: (to) => {
      if (readAuthorizationCallback(new URL(window.location.href)))
        return { path: '/', query: to.query }
      const config = store.getters.getUserConfigInfo
      return legacyConfigLocation(to.query, { complete: Boolean(config.token && config.logined && config.owner && config.repo && config.branch), hasDirectory: Boolean(config.selectedDir) })
    },
  },
  {
    path: '/login',
    redirect: to => ({ path: '/', query: to.query }),
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
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (to.path !== '/' && readAuthorizationCallback(new URL(window.location.href))) {
    return { path: '/', query: to.query }
  }
  if (['/management', '/settings'].includes(to.path)) {
    const config = store.getters.getUserConfigInfo
    if (!config.logined || !config.owner || !config.repo || !config.branch)
      return connectionLocation(to.path)
  }
  if (to.meta.title) {
    setWindowTitle(to.meta.title as string)
  }
})

export default router
