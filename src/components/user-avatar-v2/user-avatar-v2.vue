<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderMenu from '@/components/header-menu/header-menu.vue'
import PicxIcon from '@/components/picx-icon/picx-icon.vue'
import { useStore } from '@/stores'
import { getGitHubOwnerURL } from '@/utils'

withDefaults(defineProps<{ canInstall?: boolean, installing?: boolean }>(), { canInstall: false, installing: false })
const emit = defineEmits<{ install: [] }>()
const router = useRouter()
const route = useRoute()
const store = useStore()
const user = computed(() => store.getters.getUserConfigInfo)
const loginTarget = computed(() => ({
  path: '/',
  query: {
    jump: '0',
    returnTo: ['/upload', '/management', '/settings', '/config'].includes(route.path) ? route.path : '/upload',
  },
}))

const onLogout = async () => {
  const target = loginTarget.value
  await store.dispatch('LOGOUT')
  await router.replace(target)
  // 旧授权模块仍可能持有内存凭据，沿用现有完整重载的清理边界。
  window.location.reload()
}
</script>

<template>
  <template v-if="!user.logined">
    <RouterLink class="start-link" :to="loginTarget">
      {{ $t('header.get_started') }}
    </RouterLink>
    <button v-if="canInstall" type="button" class="picx-icon-button" :disabled="installing" :aria-label="$t('header.install')" @click="emit('install')">
      <PicxIcon name="download" />
    </button>
  </template>
  <HeaderMenu v-else :label="$t('header.account_for', { account: user.owner })" wide>
    <template #trigger>
      <span class="avatar">
        <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" referrerpolicy="no-referrer">
        <PicxIcon v-else name="user-round" :size="20" />
      </span>
      <span class="account-name">{{ user.owner }}</span>
      <PicxIcon name="chevron-down" :size="16" />
    </template>
    <template #default="{ close }">
      <a :href="getGitHubOwnerURL(user)" role="menuitem" target="_blank" rel="noopener noreferrer" @click="close">
        <PicxIcon name="external-link" />
        {{ $t('header.github_profile') }}
      </a>
      <RouterLink role="menuitem" :to="loginTarget" @click="close">
        <PicxIcon name="refresh-cw" />
        {{ $t('header.reconnect') }}
      </RouterLink>
      <button v-if="canInstall" type="button" role="menuitem" :disabled="installing" @click="emit('install'); close()">
        <PicxIcon name="download" />
        {{ $t('header.install') }}
      </button>
      <button type="button" role="menuitem" @click="onLogout">
        <PicxIcon name="log-out" />
        {{ $t('logout') }}
      </button>
    </template>
  </HeaderMenu>
</template>

<style scoped lang="stylus">
@import "user-avatar-v2.styl"
</style>
