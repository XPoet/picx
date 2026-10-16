<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'

const folded = computed(() => store.getters.getGlobalSettings.folded)
</script>

<template>
  <header class="header-content-box border-box" :class="{ folded }">
    <router-link class="brand-box" to="/" :aria-label="$t('header.home')">
      <img class="logo" src="../../assets/logo.svg" alt="">
      <span class="title">{{ $t('header.brand') }}</span>
    </router-link>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
