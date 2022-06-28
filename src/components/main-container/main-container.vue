<template>
  <main class="main-container" @click="changeUploadAreaActive">
    <div class="top">
      <header-content />
    </div>

    <div class="bottom">
      <div class="container">
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
  <image-viewer></image-viewer>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import headerContent from '@/components/header-content/header-content.vue'
import navContent from '@/components/nav-content/nav-content.vue'
import imageViewer from '@/components/image-viewer/image-viewer.vue'
import { useStore } from '@/store'
import userConfigInfoModel from '@/common/utils/set-theme-mode'

export default defineComponent({
  name: 'main-container',

  components: {
    headerContent,
    navContent,
    imageViewer
  },

  setup() {
    const store = useStore()

    const changeUploadAreaActive = (e: any) => {
      store.commit(
        'CHANGE_UPLOAD_AREA_ACTIVE',
        e.target.classList.contains('active-upload')
      )
    }

    onMounted(() => {
      userConfigInfoModel()
    })

    return {
      changeUploadAreaActive
    }
  }
})
</script>

<style scoped lang="stylus">
@import "main-container.styl"
</style>
