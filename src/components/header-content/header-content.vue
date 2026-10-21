<script setup lang="ts">
import BrandLogo from '@/components/brand-logo/brand-logo.vue'
import HeaderTools from '@/components/header-tools/header-tools.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
</script>

<template>
  <header class="header-content-box">
    <RouterLink class="brand-box" :to="{ path: '/', query: { jump: '0' } }" :aria-label="$t('header.home')">
      <BrandLogo />
      <span class="product-name">{{ $t('header.product') }}</span>
    </RouterLink>
    <NavContent>
      <HeaderTools />
    </NavContent>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
