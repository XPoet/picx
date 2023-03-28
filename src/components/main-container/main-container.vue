<template>
  <main class="main-container" @click="changeUploadAreaActive">
    <div class="top-container">
      <header-content />
    </div>

    <div class="bottom-container">
      <div class="bottom-content">
        <div class="left">
          <nav-content />
        </div>

        <div class="right">
          <div class="content">
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeaderContent from '@/components/header-content/header-content.vue'
import NavContent from '@/components/nav-content/nav-content.vue'
import { useStore } from '@/store'
import userConfigInfoModel from '@/utils/set-theme-mode'

const store = useStore()

const changeUploadAreaActive = (e: any) => {
  store.commit('CHANGE_UPLOAD_AREA_ACTIVE', e.target.classList.contains('active-upload'))
}

onMounted(() => {
  userConfigInfoModel()
})
</script>

<style scoped lang="stylus">
@import "main-container.styl"
</style>
