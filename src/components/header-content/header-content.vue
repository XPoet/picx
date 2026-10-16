<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import QuickActions from '@/components/quick-actions/quick-actions.vue'
import SiteAnnouncement from '@/components/site-announcement/site-announcement.vue'
import UserAvatarV2 from '@/components/user-avatar-v2/user-avatar-v2.vue'
import { useStore } from '@/stores'

const store = useStore()
const logined = computed(() => store.getters.getUserLoginStatus)
</script>

<template>
  <header class="header-content-box">
    <RouterLink class="brand-box" :to="{ path: '/', query: { jump: '0' } }" :aria-label="$t('header.home')">
      <BrandLogo />
      <span class="product-name">{{ $t('header.product') }}</span>
    </RouterLink>
    <NavContent>
      <SiteAnnouncement />
      <QuickActions v-if="logined" />
      <UserAvatarV2 />
    </NavContent>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
