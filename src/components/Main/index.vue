<template>
  <main class="main-container" @click="changeUploadAreaActive">
    <div class="top">
      <Header />
    </div>

    <div class="bottom">
      <div class="container">
        <div class="left">
          <Nav />
        </div>

        <div class="right">
          <div class="content">
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </main>
  <ImageViewer></ImageViewer>
</template>

<script lang="ts">
import Header from '@/components/Header.vue'
import Nav from '@/components/Nav/index.vue'
import ImageViewer from '@/components/image-viewer.vue'
import { useStore } from '@/store'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Main',

  components: {
    Header,
    Nav,
    ImageViewer
  },

  setup() {
    const store = useStore()
    const changeUploadAreaActive = (e: any) => {
      store.commit(
        'CHANGE_UPLOAD_AREA_ACTIVE',
        e.target.classList.contains('active-upload')
      )
    }

    return {
      changeUploadAreaActive
    }
  }
})
</script>

<style scoped lang="stylus">
@import "index.styl"
</style>
