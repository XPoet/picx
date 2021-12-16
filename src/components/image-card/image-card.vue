<template>
  <a data-fancybox="gallery" :href="imageObj.cdn_url" class="image-card">
    <div class="image"><img :src="imageObj.cdn_url" /></div>
    <div class="name">
      {{ imageObj.name }}
    </div>
  </a>
</template>

<script lang="ts" setup>
// eslint-disable-next-line no-undef
const props = defineProps({
  imageObj: {
    type: Object,
    default: () => {}
  }
})
</script>

<style scoped lang="stylus">
@import 'image-card.styl';
</style>
