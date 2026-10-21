<template>
  <div ref="container" class="nav-content-container" @keydown.esc.stop.prevent="closeMenu(true)">
    <button
      ref="menuButton"
      type="button"
      class="menu-toggle picx-icon-button"
      :title="menuOpen ? $t('nav.close_menu') : $t('nav.open_menu')"
      @click="toggleMenu"
    >
      <PicxIcon :name="menuOpen ? 'x' : 'menu'" />
    </button>
    <div v-show="!compact || menuOpen" class="nav-panel">
      <nav id="picx-primary-navigation" ref="navigation">
        <ul class="nav-menu-list">
          <li v-for="nav in visibleItems" :key="nav.name">
            <a
              v-if="'href' in nav"
              :href="nav.href"
              target="_blank"
              rel="noopener noreferrer"
              class="nav-menu-item"
              @click="closeMenu(true)"
            >
              <span>{{ $t(nav.name) }}</span>
              <PicxIcon name="external-link" :size="16" />
            </a>
            <RouterLink
              v-else
              :to="nav.to"
              class="nav-menu-item"
              :class="{ active: route.path === nav.path }"
              @click="onNavClick($event, nav.path)"
            >
              {{ $t(nav.name) }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="header-tools">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint vue/block-order: ["error", { order: ["template", "script", "style"] }] */
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import i18n from '@/plugins/vue/i18n'
import { useStore } from '@/stores'
import { connectionLocation } from '@/utils/login-navigation'
import { navInfoList } from './nav-content.data'

const route = useRoute()
const router = useRouter()
const store = useStore()
const menuOpen = ref(false)
const compact = ref(false)
const menuButton = useTemplateRef<HTMLButtonElement>('menuButton')
const navigation = useTemplateRef<HTMLElement>('navigation')
const container = useTemplateRef<HTMLElement>('container')
const visibleItems = computed(() => navInfoList.filter(item => !('requiresLogin' in item) || store.getters.getUserLoginStatus))
let media: MediaQueryList | undefined

const closeMenu = (restoreFocus = false) => {
  menuOpen.value = false
  if (restoreFocus && compact.value) {
    menuButton.value?.focus()
  }
}

const toggleMenu = async () => {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    await nextTick()
    navigation.value?.querySelector<HTMLAnchorElement>('a')?.focus()
  }
}

const onNavClick = (event: MouseEvent, path: string) => {
  if (path === '/management') {
    const { repo, branch } = store.getters.getUserConfigInfo
    if (!repo || !branch) {
      event.preventDefault()
      ElMessage.warning(i18n.global.t('connection.initialization-failed'))
      router.push(connectionLocation('/management'))
    }
  }
  closeMenu(true)
}

const onMediaChange = () => {
  compact.value = media?.matches ?? false
  closeMenu()
}

const onOutsidePointer = (event: PointerEvent) => {
  if (event.target instanceof Node && !container.value?.contains(event.target)) {
    closeMenu()
  }
}

watch(() => route.fullPath, () => closeMenu())

onMounted(() => {
  media = window.matchMedia('(max-width: 1279px)')
  onMediaChange()
  media.addEventListener('change', onMediaChange)
  document.addEventListener('pointerdown', onOutsidePointer)
})

onUnmounted(() => {
  media?.removeEventListener('change', onMediaChange)
  document.removeEventListener('pointerdown', onOutsidePointer)
})
</script>

<style scoped lang="stylus">
@import "nav-content.styl"
</style>
