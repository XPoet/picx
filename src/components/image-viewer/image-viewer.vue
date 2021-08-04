<template>
  <div class="image-viewer" :class="{ active: imageViewer.isShow }" @click="imageViewer.isShow = false">
    <div class="image-box" v-if="imageViewer.url">
      <img class="img" :src="imageViewer.url" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/store'

const store = useStore()
// eslint-disable-next-line no-unused-vars
const imageViewer = computed(() => store.getters.getImageViewer)
</script>

<style scoped lang="stylus">
@import "image-viewer.styl"
</style>
