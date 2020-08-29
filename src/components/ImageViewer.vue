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

<script>

  import {mapGetters} from "vuex";

  export default {
    name: "ImageViewer",

    data() {
      return {
      }
    },

    computed: {
      ...mapGetters({
        imageViewer: 'getImageViewer'
      })
    },

    methods: {}
  }
</script>

<style scoped lang="scss">
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
      width: 60%;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 100%;
        object-fit: cover;
      }

    }


  }

</style>
