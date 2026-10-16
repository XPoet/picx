<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import i18n from '@/plugins/vue/i18n'
import { useStore } from '@/stores'
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
    const { repo, selectedDir } = store.getters.getUserConfigInfo
    if (!repo || !selectedDir) {
      event.preventDefault()
      ElMessage.warning(i18n.global.t(!repo ? 'upload_page.message2' : 'upload_page.message3'))
      router.push('/config')
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

<template>
  <div ref="container" class="nav-content-container" @keydown.esc.stop.prevent="closeMenu(true)">
    <button
      ref="menuButton"
      type="button"
      class="menu-toggle picx-icon-button"
      :aria-label="menuOpen ? $t('nav.close_menu') : $t('nav.open_menu')"
      :aria-expanded="menuOpen"
      aria-controls="picx-primary-navigation"
      @click="toggleMenu"
    >
      <PicxIcon :name="menuOpen ? 'x' : 'menu'" />
    </button>
    <div v-show="!compact || menuOpen" class="nav-panel">
      <nav id="picx-primary-navigation" ref="navigation" :aria-label="$t('nav.label')">
        <ul class="nav-menu-list">
          <li v-for="nav in visibleItems" :key="nav.path">
            <RouterLink
              :to="nav.to"
              class="nav-menu-item"
              :class="{ active: route.path === nav.path }"
              :aria-current="route.path === nav.path ? 'page' : undefined"
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

<style scoped lang="stylus">
@import "nav-content.styl"
</style>
