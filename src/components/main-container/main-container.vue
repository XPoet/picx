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

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import headerContent from '@/components/header-content/header-content.vue'
import navContent from '@/components/nav-content/nav-content.vue'
import { useStore } from '@/store'
import userConfigInfoModel from '@/utils/set-theme-mode'

export default defineComponent({
  name: 'main-container',

  components: {
    headerContent,
    navContent
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
