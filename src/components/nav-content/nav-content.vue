<script setup lang="ts">
import { computed, onMounted, triggerRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElementPlusSizeEnum } from '@/common/model'
import QuickActions from '@/components/quick-actions/quick-actions.vue'
import SiteAnnouncement from '@/components/site-announcement/site-announcement.vue'
import UserAvatarV2 from '@/components/user-avatar-v2/user-avatar-v2.vue'
import i18n from '@/plugins/vue/i18n'
import { useStore } from '@/stores'
import { navInfoList } from './nav-content.data'

const router = useRouter()
const store = useStore()

const userConfigInfo = computed(() => store.getters.getUserConfigInfo).value
const globalSettings = computed(() => store.getters.getGlobalSettings).value

const navIconSize = computed(() => {
  switch (globalSettings.elementPlusSize) {
    case ElementPlusSizeEnum.small:
      return 21
    case ElementPlusSizeEnum.large:
      return 25
    default:
      return 23
  }
})

const onNavClick = (e: (typeof navInfoList.value)[number]) => {
  const { path } = e

  if (path === '/management') {
    if (userConfigInfo.repo === '') {
      ElMessage.warning(i18n.global.t('upload_page.message2'))
      router.push('/config')
      return
    }

    if (userConfigInfo.selectedDir === '') {
      ElMessage.warning(i18n.global.t('upload_page.message3'))
      router.push('/config')
      return
    }
  }
  router.push(path)
}

const changeNavActive = (currentPath: string) => {
  navInfoList.value.forEach((v) => {
    const temp = v
    temp.isActive = v.path === currentPath || currentPath.includes(v.path)
    return temp
  })

  triggerRef(navInfoList)
}

const onFoldNav = () => {
  store.dispatch('SET_GLOBAL_SETTINGS', {
    folded: !globalSettings.folded,
  })
}

watch(
  () => router.currentRoute.value,
  (_n) => {
    changeNavActive(_n.path)
  },
)

watch(
  () => userConfigInfo.logined,
  (_n) => {
    navInfoList.value.forEach((v) => {
      switch (v.path) {
        case '/management':
        case '/settings':
          v.isShow = _n
      }
    })
  },
  {
    deep: true,
    immediate: true,
  },
)

onMounted(() => {
  router.isReady().then(() => {
    changeNavActive(router.currentRoute.value.path)
  })
})
</script>

<template>
  <nav
    class="nav-content-container border-box"
    :aria-label="$t('nav.label')"
    :class="{ folded: store.getters.getGlobalSettings.folded }"
  >
    <div class="top-box border-box">
      <ul class="nav-menu-list border-box">
        <el-tooltip
          v-for="nav in navInfoList"
          :key="nav.uuid"
          placement="right"
          :content="$t(nav.name)"
          :show-arrow="false"
          :disabled="!store.getters.getGlobalSettings.folded"
        >
          <li
            v-show="nav.isShow"
            class="nav-menu-item border-box"
            :class="{ active: nav.isActive }"
            :aria-current="nav.isActive ? 'page' : undefined"
            tabindex="0"
            role="link"
            :aria-label="$t(nav.name)"
            @click="onNavClick(nav)"
            @keydown.enter="onNavClick(nav)"
            @keydown.space.prevent="onNavClick(nav)"
          >
            <el-icon class="nav-icon" :size="navIconSize">
              <component :is="nav.icon" />
            </el-icon>
            <span class="nav-name">{{ $t(nav.name) }}</span>
          </li>
        </el-tooltip>
      </ul>
    </div>

    <div class="bottom-box border-box">
      <div class="sidebar-actions">
        <SiteAnnouncement />
        <QuickActions v-if="userConfigInfo.logined" />
        <UserAvatarV2 />
        <button
          class="fold-button"
          type="button"
          :aria-label="globalSettings.folded ? $t('nav.expand') : $t('nav.collapse')"
          :title="globalSettings.folded ? $t('nav.expand') : $t('nav.collapse')"
          :aria-expanded="!globalSettings.folded"
          @click="onFoldNav"
        >
          <el-icon class="fold-icon">
            <IEpDArrowRight v-if="globalSettings.folded" />
            <IEpDArrowLeft v-else />
          </el-icon>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped lang="stylus">
@import "nav-content.styl"
</style>
