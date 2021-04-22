<template>
  <main class="main-container" @click="changeUploadAreaActive">
    <div class="top">
      <Header />
    </div>

    <div class="bottom">
      <div class="left">
        <Nav />
      </div>

      <div class="right">
        <div class="content">
          <router-view />
        </div>
      </div>
    </div>
  </main>
  <ImageViewer></ImageViewer>
</template>

<script lang="ts" setup>
import Header from '@/components/header.vue'
import Nav from '@/components/Nav/index.vue'
import ImageViewer from '@/components/image-viewer.vue'
import { useStore } from 'vuex'

const store = useStore()
const changeUploadAreaActive = (e: any) => {
  store.commit(
    'CHANGE_UPLOAD_AREA_ACTIVE',
    e.target.classList.contains('active-upload')
  )
}
</script>

<style scoped lang="stylus">
@import "index.styl"
</style>
