<template>
  <header class="header-content-box border-box">
    <div class="header-left border-box">
      <div class="brand-box">
        <div class="logo" @click="router.push('/')">
          <img src="../../assets/logo.png" alt="PicX" />
        </div>
        <div class="title" @click="router.push('/')">PicX</div>
      </div>
    </div>

    <div class="header-right">
      <div class="btn-item">
        <site-announcement />
      </div>
      <div class="btn-item" v-if="userConfigInfo.logined">
        <quick-actions />
      </div>
      <div class="btn-item avatar">
        <user-avatar-v2 />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { store } from '@/stores'
import router from '@/router'
import SiteAnnouncement from '@/components/site-announcement/site-announcement.vue'

const userConfigInfo = computed(() => store.getters.getUserConfigInfo)
</script>

<style scoped lang="stylus">
@import "header-content.styl"
</style>
