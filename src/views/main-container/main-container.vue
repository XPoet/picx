<template>
  <main class="main-container">
    <div class="top-container">
      <header-content />
    </div>

    <div class="bottom-container">
      <div class="bottom-content">
        <div class="left">
          <nav-content />
        </div>

        <div class="right">
          <router-view />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeaderContent from '@/components/header-content/header-content.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import userConfigInfoModel from '@/utils/set-theme-mode'

onMounted(() => {
  userConfigInfoModel()
})
</script>

<style scoped lang="stylus">
@import "./main-container.styl"
</style>
