<template>
  <div class="image-viewer"
       v-if="imageViewer.isShow"
       @click="imageViewer.isShow = false"
  >
    <div class="image-box"
         v-if="imageViewer.url"
    >
      <img class="img"
           :src="imageViewer.url"
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const imageViewer = computed(() => store.getters.getImageViewer)
</script>

<style scoped lang="stylus">
.image-viewer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 1000;

  .image-box {
    position: relative;
    width: 60%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (max-width: 1200px) {
      width: 80%;
    }

    .img {
      max-width: 100%;
      max-height: 100%;
    }

  }


}

</style>
