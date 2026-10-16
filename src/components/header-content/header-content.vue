<script setup lang="ts">
import { computed } from 'vue'
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import { store } from '@/stores'

const folded = computed(() => store.getters.getGlobalSettings.folded)
</script>

<template>
  <header class="header-content-box border-box" :class="{ folded }">
    <router-link class="brand-box" to="/" :aria-label="$t('header.home')">
      <BrandLogo class="logo" :variant="folded ? 'symbol' : 'horizontal'" />
      <span class="title">{{ $t('header.product') }}</span>
    </router-link>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
