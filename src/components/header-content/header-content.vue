<script setup lang="ts">
import { computed } from 'vue'
import SiteAnnouncement from '@/components/site-announcement/site-announcement.vue'
import router from '@/router'
import { store } from '@/stores'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
</script>

<template>
  <header class="header-content-box border-box">
    <div class="header-left border-box">
      <div class="brand-box">
        <div class="logo" @click="router.push('/')">
          <img src="../../assets/logo.png" alt="PicX">
        </div>
        <div class="title" @click="router.push('/')">
          PicX
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="btn-item">
        <SiteAnnouncement />
      </div>
      <div v-if="userConfigInfo.logined" class="btn-item">
        <quick-actions />
      </div>
      <div class="btn-item avatar">
        <user-avatar-v2 />
      </div>
    </div>
  </header>
</template>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
